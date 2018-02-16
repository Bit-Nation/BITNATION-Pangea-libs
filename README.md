# Pangea Libs
> A Javascript + Flow implementation of the pangea utils

[![Build Status](https://semaphoreci.com/api/v1/florianlenz/bitnation-pangea-libs/branches/develop/badge.svg)](https://semaphoreci.com/florianlenz/bitnation-pangea-libs)
[![Coverage Status](https://coveralls.io/repos/github/Bit-Nation/BITNATION-Pangea-libs/badge.svg?branch=develop)](https://coveralls.io/github/Bit-Nation/BITNATION-Pangea-libs?branch=develop)

## Documentation
See [here](http://bitnation-pangea-libs.readthedocs.io/) for the documentation. If you have question's create an issue for it. Feel free to have a look at the code as well since we are are heavely using JsDoc.

## Development

We are using docker for development.

1. Get docker
2. Run `docker-compose up -d`
3. Run `docker-compose exec node bash`
4. Within the docker image's shell, you may run `npm install` to set up the dependencies, and `npm test` to test the project.

## Troubleshooting

Problem: Test suite fails to run with `TypeError: Cannot redefine property: Worker`  

Fix: See https://github.com/Bit-Nation/BITNATION-Pangea-libs/issues/55 for a deep dive into this issue. This is caused from a faulty version of realm installed locally. Version 2.1.1 of realm must be used in order to avoid this. This is believed to be fixed as of 2/7/2018 in the `develop` branch.