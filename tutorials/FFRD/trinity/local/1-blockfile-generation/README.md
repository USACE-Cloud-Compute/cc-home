## Blockfile Generation
The process of generating the blockfile is relatively simple. This file defines the simulation structure for a nested, blocked, Monte Carlo. The nesting is separation of the simulation structure into realizations and sets of events within each realization, each realization representing a sample of Knowledge Uncertainty the sets of events within each realization representing the Natural Variabilities of the process in question. The blocking is a separation of events within a realization to represent a synthetic year, this allows for multiple events across a given watershed to be grouped to represent a watershed scale annual maximum composite.

## Blockfile Action documentation
https://github.com/USACE-Cloud-Compute/seed-generator-plugin/blob/main/internal/actions/block-generation-action.md

## parametrization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `target_total_events` | Total number of events to generate | 50
| `blocks_per_realization` | Number of blocks per realization | 5
| `target_events_per_block` | Target number of events per block | 2
| `seed` | Random seed for reproducible results (default: 1234) | 4321
| `outputdataset_name` | Name of the output dataset | blocks.json
| `store_type` | Storage type ("eventstore" or other) | "json"