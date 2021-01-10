# Chinook Wawa Search

This utility provides a static website (hostable on github: [link](https://chinookwawasearch.github.io))
for bidirectionally searching Chinook Wawa words and their English glosses. Some assembly required.

## Build

The dictionary itself needs to be scraped from a variety of sources. The following commands assemble the dictionary, 
which can then be committed into git and pushed to github.io. However, a `secret.json` file is required to host
the API keys and sources for the dictionary, and it is not provided in the repository.

```bash
  # install dependencies
  python3 -m pip install google-api-python-client google-auth-oauthlib
  
  python3 retrieve.py  # scrapes web sources
  python3 collate.py   # assembles dictionary
  git push origin main # publishes the site (if hosted on github)
```

## Host Locally

This directory is servable as a static site. For example, you can serve with python's SimpleHTTPServer module:

```bash
  python3 -m http.server 8000
```

You can then connect to [localhost:8000](http://localhost:8000) to test the site.
