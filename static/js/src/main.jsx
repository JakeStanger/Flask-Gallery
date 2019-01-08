if (global === undefined) {
    var global = window;
}

class FilterControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tags: []};
    }

    autocompleteRenderInput({addTag, ...props}) {
        const handleOnChange = (e, {newValue, method}) => {
            if (method === 'enter') {
                e.preventDefault()
            } else {
                props.onChange(e)
            }
        };

        const inputValue = (props.value && props.value.trim().toLowerCase()) || '';
        const inputLength = inputValue.length;

        let suggestions = this.props.filters.filter((state) => {
            return state.toLowerCase().slice(0, inputLength) === inputValue
        });

        // Define here to escape Jinja
        const inputProps = {...props, onChange: handleOnChange};

        return (
            <Autosuggest
                ref={props.ref}
                suggestions={suggestions}
                shouldRenderSuggestions={(value) => value && value.trim().length > 0}
                getSuggestionValue={(suggestion) => suggestion}
                renderSuggestion={(suggestion) => <span key={suggestion}>{suggestion}</span>}
                inputProps={inputProps}
                onSuggestionSelected={(e, {suggestion}) => {
                    addTag(suggestion)
                }}
                onSuggestionsClearRequested={() => {
                }}
                onSuggestionsFetchRequested={() => {
                }}
            />
        )
    }

    setTags(tags) {
        tags = [...new Set(tags.filter(t =>
            this.props.filters.indexOf(t) > -1))];
        this.setState({tags: tags}, () => {
            this.props.onTagChange(tags);
        });
    }

    render() {
        const inputProps = {
            placeholder: this.props.placeholder
        };
        return (
            <TagsInput value={this.state.tags} onChange={this.setTags.bind(this)}
                       renderInput={this.autocompleteRenderInput.bind(this)} inputProps={inputProps}/>
        );
    }
}

function Image(p) {
    return (
        <div className="card">
            <a href={`/image/${p.filename}`}>
                <img className="img-fluid"
                     src={`/image/${p.filename}/view/thumb`}
                     alt={p.name}/>
            </a>
            <div className="info">
                <div className="title">{p.name}</div>
                {p.location && <div><b>Location: </b>{p.location}</div>}
                {p.taken_time && <div><b>Taken: </b>{p.taken_time}</div>}
                {p.description && <div className="description"><i>{p.description}</i></div>}
                {p.tags && p.tags.length && <div className="tags">
                    {p.tags.map(tag =>
                        <div key={tag} className="tag">{tag}</div>
                    )}
                </div>}
            </div>
        </div>
    );
}

async function fetchImages() {
    return await fetch(`/images?${state.tags.length ? `tags=${state.tags.join(',')}&` : ""}`
        + `${state.locations.length ? `locations=${state.locations.join(',')}&` : ""}`
        + `${state.query ? `query=${state.query}` : ""}`)
        .then(res => res.json()).catch(console.error);
}

async function fetchTags() {
    let tags = await fetch("/tags").then(res => res.json()).catch(console.error);
    if (typeof tags == 'string') tags = [tags];
    return tags;
}

async function fetchLocations() {
    let locations = await fetch("/locations").then(res => res.json()).catch(console.error);
    if (typeof locations == 'string') locations = [locations];
    return locations;
}

async function fetchData() {
    const images = await fetchImages();
    const tags = await fetchTags();
    const locations = await fetchLocations();

    return {images: images, tags: tags, locations: locations};
}

const state = {
    tags: [],
    locations: [],
    query: ""
};

function render() {
    fetchData().then(data => ReactDOM.render(
        <React.Fragment>
            <div className="header">
                <h1>Images</h1>
                <a href="#" data-target="#filter-controls" data-toggle="collapse">Toggle filters</a>
            </div>

            <div className="filter-controls collapse" id="filter-controls">
                <div className="row">
                    <div className="col-sm-4">
                        <div className="react-tagsinput">
                            <input type="text" placeholder="Search" className="react-tagsinput-input"
                                   onChange={ev => {
                                       state.query = ev.target.value;
                                       render();
                                   }}/>
                        </div>
                    </div>
                    <div className="col-sm-4">
                        <FilterControl filters={data.tags} placeholder="Filter tags"
                                       onTagChange={tags => {
                                           state.tags = tags;
                                           render();
                                       }}/>
                    </div>
                    <div className="col-sm-4">
                        <FilterControl filters={data.locations} placeholder="Filter locations"
                                       onTagChange={locations => {
                                           state.locations = locations;
                                           render();
                                       }}/>
                    </div>
                </div>
            </div>
            <div className="gallery">
                {data.images.filter((_, i) => i % 3 === 0)
                    .concat(data.images.filter((_, i) => (i - 1) % 3 === 0)
                        .concat(data.images.filter((_, i) => (i - 2) % 3 === 0)))
                    .map(image =>
                        <Image key={image.name} {...image} />
                    )}
            </div>
        </React.Fragment>
        , document.querySelector("div#react-container")));
}

render();