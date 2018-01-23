> Some of the pangea lib's dependencies must be adjusted to the environment. E.g. the key chain access and some sort of that. You can find the spec's here:

## JsonRpcNodeInterface
> The `JsonRpcNodeInterface` exported by `src/specification/jsonRpcNode.js` is an interface that must be implemented for ethereum nodes.

## OsDependenciesInterface
> The `OsDependenciesInterface` exported by `src/specification/osDependencies.js` must be implemented for every environment. It contain's useful method's for cryptography (like randombytes, etc)

## SecureStorageInterface
> The `SecureStorageInterface` exported by `src/specification/secureStorageInterface.js` must be implemented by every environment in order to store values secure.