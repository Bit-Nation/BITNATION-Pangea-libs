# Panthalassa
> A Javascript + Flow implementation of panthalassa

[![Build Status](https://semaphoreci.com/api/v1/florianlenz/panthalassa/branches/feature-test_coverage/badge.svg)](https://semaphoreci.com/florianlenz/panthalassa)
[![Coverage Status](https://coveralls.io/repos/github/Bit-Nation/Panthalassa/badge.svg)](https://coveralls.io/github/Bit-Nation/Panthalassa)

## Api
> Panthalassa is under heavy development. Things will change fast.

Pantalassa follows a modular approache to provide more flexibilty since it will be used on our mobile & desktop client. The context in which panthalassa run's on mobile and on desktop is pretty different (on mobile it's the browser engine and on desktop it's node js), so you might see us abstracting some thing's like the random bytes function because the context is different (`crypto.randomBytes()` can't be used in the browser)

Modules:
- [Database](src/database) contain database related functionality
- [Ethereum](src/ethereum) contain all ethereum releated code
- [Profile](src/profile) profile related functionality
- [SecureStorage](src/secure_storage) contains a node js secure storage
- [Specification](src/specification) contain all the specifications. E.g. for the secure storage.

## FAQ

**I heard this is supposed to be the backend of The Pangea Jurisdiction, can you please explain?**
>Ok, so your backend is not a common backend where you make a few http request, get some data back and done. Instead, our backend is a decentraliced meshnetwork. Meaning each device in the network is a "server" (not really a server but a node). Therefor it needs to run on each device (like smartphones and laptops). The owner of the device will be able to communicate with other people in the network since the device becomes a node in the network.

## Specification

#### Secure Storage
> The secure storage is used to save critical information such as private keys in a save environment. 

You can find the specification [here](./src/specification/secureStorageInterface.js)

## Development

We are using docker for development.

1. Get docker
2. Run `docker-compose up -d`
3. Run `docker-compose exec node bash`