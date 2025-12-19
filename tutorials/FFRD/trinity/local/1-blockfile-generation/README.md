## Blockfile Generation
The process of generating the blockfile is relatively simple. This file defines the simulation structure for a nested, blocked, Monte Carlo. The nesting is separation of the simulation structure into realizations and sets of events within each realization, each realization representing a sample of Knowledge Uncertainty the sets of events within each realization representing the Natural Variabilities of the process in question. The blocking is a separation of events within a realization to represent a synthetic year, this allows for multiple events across a given watershed to be grouped to represent a watershed scale annual maximum composite.

## Blockfile Action documentation
https://github.com/USACE-Cloud-Compute/seed-generator-plugin/blob/main/internal/actions/block-generation-action.md

### Plugin Manifest
To begin running the tutorial, first we need a [plugin manifest](https://github.com/USACE-Cloud-Compute/cc-home/blob/main/docs/plugin-manifest.md) for the `seed-generator` plugin.  For this tutorial one has already been created in the common folder.

Briefly, the seed generator plugin manifest contains the information necessary to "register" and allocate resources for the compute provider which is a local docker provider for this tutorial.  Files are stored in a local object store using `minio`, therefore our compute plugin must provide the configuration variables to connect to the object store.  

The structure of the plugin manifest is documented in the link above, however, several aspects of this plugin manifest are notable:
  - first, is that there are environment variables for a "profile" of "CC".  The CC environment variables represent the variables necessary to connect to the CC store which will contain the payload for the plugin when it runs.  If a plugin is using a cloud compute SDK and requires a payload it will need CC store environment variables.
  - second, are the environment variables for FFRD.  These represent the veariables necessary to connect to the "FFRD" store which is the store containing our actual model files and data.
  - third are the credential section.  This section provides a mapping between the credential manager and the environment variable that will be injected into the plugin.  that because this is a local docker compute provider, credential mappings are quite simple and work in this way.  The example: 
    ```json
    {
                "name":  "FFRD_AWS_ACCESS_KEY_ID",
                "value": "secretsmanager:AWS_ACCESS_KEY_ID::"
    },
    ```
    indicates that the secrets manager (one provided inthe local docker implementation) will map the variable "AWS_ACCESS_KEY_ID" to an environment variable in the running plugin of "FFRD_AWS_ACCESS_KEY_ID".

### Compute Manifest
Next we need a [compute manifest](https://github.com/USACE-Cloud-Compute/cc-home/blob/main/docs/compute-manifest.md) to define the actual compute job variables and actions.  Referring to the "compute-manifest.json" for this tutorial run,  we will need the folowing:

```json
{
    "manifest_name": "block-generation", //user defined.  Set this to any name you like.
    "plugin_definition": "FFRD-SEED-GENERATOR",  //this must match the name from the seed-generator-plugin-manifest
    "stores": [
        {
            "name": "FFRD", //name of the store.  This is defined by the plugin author.
            "store_type": "S3", //type of store.  S3 for this tutorial
            "profile": "FFRD", //the profile prefix that will be used to extract the environment variable configuration.
            "params": {
                "root": "/model-library/ffrd-trinity" //the location on the store that all references will start from
            }
        }
    ],
    "outputs": [
        {
            "name": "blocks.json", //the name of the outout data source.  This is defined by the plugin author
            "paths": {
                "default": "conformance/simulations/blocks.json" //the path to the output location relative to the store root.
            },
            "store_name": "FFRD" //the store that will be used to write the output
        }
    ],
    "actions": [
        {
            "name": "block-generation-fixed-length",  //the name of the action to run.  Actions are defined by the plugin author
            "type": "block-generation-fixed-length", //this is a legecy field. for now, set it to the same value as the namne.
            "description": "generating blocks", //a user defined description for the run
            "attributes": { //blockfile generation action parameters are defined in the parameter block below
                "target_total_events": 50,
                "blocks_per_realization": 5,
                "target_events_per_block": 2,
                "seed": 4321,
                "outputdataset_name": "blocks.json",
                "store_type": "json"
            }
        }
    ]
}

```

## parametrization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `target_total_events` | Total number of events to generate | 50
| `blocks_per_realization` | Number of blocks per realization | 5
| `target_events_per_block` | Target number of events per block | 2
| `seed` | Random seed for reproducible results (default: 1234) | 4321
| `outputdataset_name` | Name of the output dataset | blocks.json
| `store_type` | Storage type ("eventstore" or other) | "json"

----

### Compute file
The compute file effectively links the plugin manifest, compute manifest and compute provider together.

```json
{
    "name": "Blockfile Generation Test",
    "provider": { //this block defined the compute provider
        "type": "docker", //we will use the local docker provider
        "concurrency": 1, //we do not need to run multiple concurrent jobs, so this is set to 1
        "queue": "docker-local" //the local docker provider has a single internal queue defined as "docker-local"
    },
    "plugins": [
        "../common/seed-generator-plugin-manifest.json" //reference to the plugin manifest
    ],
    "event": {
        "compute-manifests": [
            "compute-manifest.json" //reference to the compute manifest
        ]
    },
    
    //local docker has a simple in-memory credential management system.
    //it maps environment variables to secretsmanager key names.  
    //for example, in this configuration the env variable AWS_ACCESS_KEY_ID is mapped to a credentail manager variable of "secretsmanager:AWS_ACCESS_KEY_ID::".  subsequently, in the plugin manifest configuration, the credential manager value of "secretsmanager:AWS_ACCESS_KEY_ID::" is mapped into the running plugin as FFRD_AWS_ACCESS_KEY_ID
    "secrets-manager": {
        "type": "env",
        "secrets": {
            "secretsmanager:AWS_ACCESS_KEY_ID::": "AWS_ACCESS_KEY_ID",
            "secretsmanager:AWS_SECRET_ACCESS_KEY::": "AWS_SECRET_ACCESS_KEY"
        }
    }
}
```


### Running the blockfile generation
to run the blockfile generation performm the following steps
  1) make sure you have set up your local stores and copied the starting set of trinity files into your ffrd store
  2) create an environment file to run local docker compute.  The file must have the following elements:
     ```bash
        CC_AWS_ACCESS_KEY_ID={Minio AccessKey}
        CC_AWS_SECRET_ACCESS_KEY={Minio SecretKey}
        CC_AWS_DEFAULT_REGION=us-east-1
        CC_AWS_S3_BUCKET={cc store bucket name}
        CC_AWS_ENDPOINT={minio local endpoint.  Typically "http://localhost:9000"}
        AWS_ACCESS_KEY_ID={Minio AccessKey}
        AWS_SECRET_ACCESS_KEY={Minio SecretKey}
        CC_ROOT=cc_store
     ```
  3) open a command line into the `1-blockfile-generation` directory
  4) run the following command:
  ```bash
  >> cccli -e={path to your environment file} run
  ```
  for a successfull run, you should see output similar to this:
  ```txt
    Compute Identifier: 755ecc78-d2de-4aae-ba0f-bca924652f59
    2025/12/19 11:23:35 SUBMITTED JOB: a4cc92f6-298f-4994-9e10-146b82575532
    2025/12/19 11:23:35 RUNNING JOB: a4cc92f6-298f-4994-9e10-146b82575532
    STARTING MONITOR FOR: bebb74f4c847530234a0e38a7501144d7b0673b9a8918d6e3fb3409c2abdf779
    JOB: a4cc92f6-298f-4994-9e10-146b82575532: 2025-12-19T16:23:35.213061014Z SDK 2025/12/19 16:23:35 WARN Response has no supported checksum. Not validating response payload.
    JOB: a4cc92f6-298f-4994-9e10-146b82575532: 2025-12-19T16:23:35.213309139Z {"time":"2025-12-19T16:23:35.213184097Z","level":"INFO","msg":"Seed Generator","version":"v1.0.5-0-gdcd5fc0","build-date":"2025-11-10T18:27:06Z"}
    JOB: a4cc92f6-298f-4994-9e10-146b82575532: 2025-12-19T16:23:35.213319097Z {"time":"2025-12-19T16:23:35.213200847Z","level":"INFO","msg":"Running block-generation-fixed-length"}
    JOB: a4cc92f6-298f-4994-9e10-146b82575532: 2025-12-19T16:23:35.219764639Z {"time":"2025-12-19T16:23:35.21963918Z","level":"INFO","msg":"Completed block-generation-fixed-length"}
    2025/12/19 11:23:35 FINISHED JOB: a4cc92f6-298f-4994-9e10-146b82575532
  ```