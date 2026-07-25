# @castle/core-types

Dependency-free semantic foundation for the Rhizoh monorepo.

## Scope
- shared epistemic primitives: confidence, decision, action
- spatial primitives: vector3
- lightweight observation/event envelopes

## Intended usage
Higher-level packages such as event-runtime, ontology, simulation-runtime, and future Rust/C++ ports should depend on this package for shared meaning rather than re-defining their own primitives.
