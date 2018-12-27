import os
from fractions import Fraction

from flask import Flask, render_template, request, send_file, make_response, jsonify
from flask_login import LoginManager
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename
from PIL import Image, ExifTags
from datetime import datetime

import database
import json
import requests

with open('settings.json', 'r') as f:
    settings = json.loads(f.read())

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = settings['database_uri']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

login_manager = LoginManager(app)

database.init(app)


def to_fraction(num: float):
    return str(Fraction(num).limit_denominator())


app.jinja_env.globals['to_fraction'] = to_fraction


def get_friendly_name(filename: str) -> str:
    return filename.split('.')[0].replace('_', ' ').replace('-', ' ').title().strip()


@app.route('/', methods=['GET'])
def index():
    images = database.session().query(database.Image).all()
    return render_template('main.html', images=images)


@app.route('/image/<string:filename>', methods=['GET'])
def image(filename: str):
    image = database.session().query(database.Image).filter_by(filename=filename).one()
    return render_template('view_image.html', image=image)


@app.route('/image/<string:filename>/view', methods=['GET'])
def image_view(filename: str):
    try:
        image = database.session().query(database.Image).filter_by(filename=filename).one()
        return send_file(os.path.join(settings['upload_directory'], image.filename), mimetype='image/jpeg')
    except:
        return make_response("404", 404)


@app.route('/image/<string:filename>/tags', methods=['GET'])
def image_tags(filename):
    image = database.session().query(database.Image).filter_by(filename=filename).first()
    if image:
        tags = [*map(lambda x: x.name, image.tags)]
        return jsonify(tags)
    else:
        return make_response("404", 404)


@app.route('/image/<string:filename>/edit', methods=['GET'])
def image_edit(filename):
    image = database.session().query(database.Image).filter_by(filename=filename).first()
    return "Edit"  # TODO Implement editing


@app.route('/upload', methods=['GET', 'POST', 'DELETE'])
def upload():
    if request.method == 'GET':
        return render_template('upload.html')

    elif request.method == 'POST':
        file: FileStorage = request.files['filepond']

        if 'image_view/' in file.mimetype:
            filename = secure_filename(file.filename)
            filepath = os.path.join(settings['upload_directory'], filename)
            if not os.path.exists(filepath):
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
                    exif = {}

                # Get image_view tags
                api_key = settings['imagga_api_key']
                api_secret = settings['imagga_api_secret']
                image_url = '%s/%s' % (settings['external_url'], filename)

                response = requests.get('https://api.imagga.com/v2/tags?image_url=%s&limit=5&threshold=25' % image_url,
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

                db_image = database.Image(name=get_friendly_name(filename),
                                          filename=filename,
                                          width=width, height=height,
                                          exposure=exif['ExposureTime'][0] / exif['ExposureTime'][1],
                                          focal_length=exif['FocalLength'][0] / exif['FocalLength'][1],
                                          aperture=exif['FNumber'][0] / exif['FNumber'][1],
                                          iso=exif['ISOSpeedRatings'],
                                          camera_model=exif['Model'],
                                          taken_time=datetime.strptime(exif['DateTimeOriginal'], '%Y:%m:%d %H:%M:%S'),
                                          tags=tag_list)

                database.session().add(db_image)
                database.session().commit()

            else:
                return make_response("An image_view with this name already exists", 400)  # TODO Return 400 + JSON

        return make_response("File uploaded", 201)

    elif request.method == 'DELETE':
        print(request.form, request.headers)
        return make_response("Files deleted", 200)


if __name__ == '__main__':
    app.run()
