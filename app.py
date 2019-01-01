import os
import re
import traceback
from fractions import Fraction
from functools import wraps

from flask import Flask, render_template, request, send_file, make_response, jsonify, url_for, flash
from flask_login import LoginManager, login_required, login_user, logout_user
from werkzeug.datastructures import FileStorage
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename, redirect
from PIL import Image, ExifTags
from datetime import datetime, MINYEAR

import database
import json
import requests

with open('settings.json', 'r') as f:
    settings = json.loads(f.read())

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = settings['database_uri']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config.update(SECRET_KEY=settings['secret_key'])

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

database.init(app)


def to_fraction(num: float):
    return str(Fraction(num).limit_denominator())


app.jinja_env.globals['to_fraction'] = to_fraction


def get_friendly_name(filename: str) -> str:
    return filename.split('.')[0].replace('_', ' ').replace('-', ' ').title().strip()


def get_current_user() -> database.User:
    from flask_login import current_user
    return current_user


@login_manager.user_loader
def get_user(user_id):
    if re.match('^[0-9]$', user_id):
        user = database.session().query(database.User).filter_by(id=user_id).first()
    else:
        user = database.session().query(database.User).filter_by(username=user_id).first()
    return user


def require_can_upload(func, get_user=get_current_user):
    @login_required
    @wraps(func)
    def admin_wrapper(*args, **kwargs):
        user = get_user()
        if not user.can_upload:
            # logger.info("User %s attempted to send an admin-only request without admin privileges.")
            return make_response("Only administrators can do this.", 401)

        return func(*args, **kwargs)

    return admin_wrapper


def require_can_edit(func, get_user=get_current_user):
    @login_required
    @wraps(func)
    def admin_wrapper(*args, **kwargs):
        user = get_user()
        if not user.can_edit:
            # logger.info("User %s attempted to send an admin-only request without admin privileges.")
            return make_response("Only administrators can do this.", 401)

        return func(*args, **kwargs)

    return admin_wrapper


@app.route('/', methods=['GET'])
def index():
    images = database.session().query(database.Image).all()
    return render_template('main.html', images=images)


@app.route('/image/<string:filename>', methods=['GET'])
def image(filename: str):
    try:
        image = database.session().query(database.Image).filter_by(filename=filename).one()
        return render_template('view_image.html', image=image)
    except Exception as e:
        traceback.print_exc()
        return make_response("404", 404)


@app.route('/image/<string:filename>/view', methods=['GET'])
@app.route('/image/<string:filename>/view/<thumb>', methods=['GET'])
def image_view(filename: str, thumb: bool = False):
    try:
        image = database.session().query(database.Image).filter_by(filename=filename).one()
        return send_file(os.path.join(settings['upload_directory'], image.filename + ('.thumb' if thumb else '')),
                         mimetype='image/jpeg')
    except Exception as e:
        traceback.print_exc()
        return make_response("404", 404)


@app.route('/image/<string:filename>/edit', methods=['GET', 'POST'])
@app.route('/image/edit', methods=['POST'])
def image_edit(filename: str = None):
    if not filename:
        filename = secure_filename(request.json.get('filename'))
    try:
        image = database.session().query(database.Image).filter_by(filename=filename).one()
        if request.method == 'POST':
            get = lambda x: request.json.get(x)

            if get('name'):
                image.name = get('name')
            if get('description'):
                image.description = get('description')

            if get('tags'):
                tag_list = []
                for tag in get('tags'):
                    db_tag = database.session().query(database.Tag).filter_by(name=tag).first()
                    if db_tag:
                        tag_list.append(db_tag)
                    else:
                        db_tag = database.Tag(name=tag)
                        database.session().add(db_tag)
                        tag_list.append(database.session().query(database.Tag).filter_by(name=tag).one())

                image.tags = tag_list

            if get('location'):
                db_location = database.session().query(database.Location).filter_by(name=get('location')).first()
                if db_location:
                    image.location = db_location
                else:
                    db_location = database.Location(name=get('location'))
                    database.session().add(db_location)
                    image.location = database.session().query(database.Location).filter_by(name=get('location')).one()

            database.session().commit()

            flash("Image succesfully uploaded", category='success')
            return redirect(url_for('index'))
        return "EDIT %s" % filename
    except Exception as e:
        traceback.print_exc()
        flash("The image could not be found. This is a bug! " + str(e), category='error')
        return redirect(request.referrer)


@app.route('/image/<string:filename>/process', methods=['POST'])
def process_image(filename: str):
    return "Process"


# @require_can_upload
@app.route('/upload', methods=['GET', 'POST', 'DELETE'])
@require_can_upload
def upload():
    if request.method == 'GET':
        locations = database.session().query(database.Location).all()
        tags = database.session().query(database.Tag).all()
        return render_template('upload.html', locations=[*map(lambda location: location.name, locations)],
                               tags=[*map(lambda tag: tag.name, tags)])

    elif request.method == 'POST':
        file: FileStorage = request.files['filepond']

        if 'image/' in file.mimetype:
            filename = secure_filename(file.filename)
            filepath = os.path.join(settings['upload_directory'], filename)
            if not os.path.exists(filepath):
                try:
                    file.save(filepath)

                    pil_img = Image.open(filepath)

                    width, height = pil_img.size

                    # Get EXIF data
                    if hasattr(pil_img, '_getexif'):
                        exif = {
                            ExifTags.TAGS[k]: v
                            for k, v in pil_img._getexif().items()
                            if k in ExifTags.TAGS
                        }
                    else:
                        exif = None

                    # Save thumbnail
                    pil_img.thumbnail((360, 480), Image.ANTIALIAS)
                    pil_img.save(filepath + ".thumb", "JPEG")

                    # Get image_view tags
                    api_key = settings['imagga_api_key']
                    api_secret = settings['imagga_api_secret']
                    image_url = '%s/%s' % (settings['external_url'], filename)

                    response = requests.get(
                        'https://api.imagga.com/v2/tags?image_url=%s&limit=5&threshold=25' % image_url,
                        auth=(api_key, api_secret))

                    tags = [*map(lambda x: x['tag']['en'],
                                 response.json()['result']['tags'])][:5]

                    tag_list = []
                    for tag in tags:
                        db_tag = database.session().query(database.Tag).filter_by(name=tag).first()
                        if db_tag:
                            tag_list.append(db_tag)
                        else:
                            db_tag = database.Tag(name=tag)
                            database.session().add(db_tag)
                            tag_list.append(database.session().query(database.Tag).filter_by(name=tag).first())

                    friendly_name = get_friendly_name(filename)

                    db_image = database.Image(name=get_friendly_name(friendly_name),
                                              filename=filename,
                                              width=width, height=height,
                                              tags=tag_list)

                    def get_exif_key(keyname: str, div: bool = False):
                        if keyname in exif:
                            if div:
                                try:
                                    return exif[keyname][0] / exif[keyname][1]
                                except:
                                    return None
                            return exif[keyname]
                        else:
                            return None

                    if exif:
                        db_image.exposure = get_exif_key('ExposureTime', True)
                        db_image.focal_length = get_exif_key('FocalLength', True)
                        db_image.aperture = get_exif_key('FNumber', True)
                        db_image.iso = get_exif_key('ISOSpeedRatings')
                        db_image.camera_model = get_exif_key('Model')
                        if get_exif_key('DateTimeOriginal'):
                            db_image.taken_time = datetime.strptime(get_exif_key('DateTimeOriginal'),
                                                                    '%Y:%m:%d %H:%M:%S')

                    database.session().add(db_image)
                    database.session().commit()
                    # os.remove(filepath)
                except Exception as e:
                    traceback.print_exc()
                    os.remove(filepath)
                    return make_response("An unknown error occurred: " + str(e), 500)

            else:
                return make_response("An image with this name already exists", 400)  # TODO JSON

            return make_response(jsonify({'name': friendly_name, 'filename': filename, 'tags': tags}), 201)

    elif request.method == 'DELETE':
        print(request.form, request.headers)
        return make_response("Files deleted", 501)  # TODO: Add delete method


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username').lower()
        password = request.form.get('password')
        remember = request.form.get('remember') is not None
        user = get_user(username)

        if user:
            if check_password_hash(user.password, password):
                login_user(user, remember)
                return redirect(request.args.get('next') or url_for('index'))
            else:
                flash("Incorrect password", category='error')
        else:
            flash("That username does not exist", category='error')

    return render_template('login.html')


@app.route('/signup', methods=['POST'])
def sign_up():
    username = request.form['username'].lower()
    password = request.form['password']
    remember = request.form.get('remember') is not None

    # noinspection PyArgumentList
    user = database.User(username=username, password=generate_password_hash(password))
    database.session().add(user)
    database.session().commit()

    user = get_user(username)
    login_user(user, remember)
    return redirect(url_for('index'))


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run()
