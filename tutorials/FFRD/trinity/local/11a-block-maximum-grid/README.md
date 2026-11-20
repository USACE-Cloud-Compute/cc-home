## Block Maximum Grids
After grids are exported from each ams contributing event, the annual maximum series is calculated for each block.

## Export Block Maximum Grid Action documentation
This tool is using the Raster Algebra action: https://github.com/USACE-Cloud-Compute/aggregator/blob/main/actions/raster-algebra-action.md

### Plugin Manifest
The creation of a plugin manifest for the aggregator plugin is documented [here](../1-blockfile-generation/README.md#plugin-manifest).

### Compute Manifest
We need a compute manifest to define the actual compute job variables and actions. Referring to the "compute-manifest.json" for this tutorial run, we will need the following:

```json
{
    "manifest_name":     "trinity-conformance-max-grid",
    "plugin_definition": "CC-AGGREGATOR-PLUGIN",
    "stores": [
        {
            "name":      "FFRD",
            "store_type": "S3",
            "profile": "FFRD",
            "params": {
                "root": "/model-library/ffrd-trinity"
            }
        }
    ],
    "inputs": {
        "payload_attributes":{
            "scenario":"conformance",
            "gridType":"velocity"
        }
    },
    "actions": [
       {
            "name": "raster-algebra",
            "type": "raster-algebra",
            "description": "raster algebra",
            "attributes":{
                "grids": [
                    "/vsis3/project-data/model-library/ffrd-trinity/{ATTR::scenario}/simulations/event-data/{ENV::BLOCK_EVENTS[]}/grids/{ENV::MODEL_PREFIX}/{ATTR::gridType}.tif"
                ],
                "gridOut": "{ATTR::scenario}/simulations/summary-data/max-grids/{ENV::MODEL_PREFIX}/max_realz_1_block_{ENV::CC_EVENT_IDENTIFIER}_{ATTR::gridType}.tif",
                "loadingConcurrency": 5,
                "rasterAlgebraFunction":"max",
                "noDataComputeSubstitutionValue":0.0,
                "copyLocal":false
            }
        }
    ]
}
```


## Parameterization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `scenario` | scenario being processed | conformance
| `gridType` | grid type being processed.  "velocity" or "depth" | velocity
| `grids` | the set of ams contributing event GDAL grid paths.  This can be an explicitly defined set of grids, or it can be generated from the set of ams contributing events | "/vsis3/project-data/model-library/ffrd-trinity/conformance/simulations/event-data/1/grids/model1/velocity.tif"
| `gridOut` | Path to the output grid relative to the remote store| conformance/simulations/summary-data/max-grids/model1/max_realz_1_block_1_velocity.tif,
| `loadingConcurrency` | Number of grids that will be loaded in parallel| 5
| `rasterAlgebraFunction` | "max" | max
| `noDataComputeSubstitutionValue` | depth or velocity value used when a no-data (-9999) is read from a grid | 0.0
| `copyLocal` | when true copies the grids to the local block and processes locally.  When false reads the input grids directly from the grids array paths.  If set to true, make sure you have enough space locally on the block to store copies of the grids.  Local processing will result in better performance.| true


### Compute file
The compute file effectively links the plugin manifest, compute manifest and compute provider together.

```json
{
    "name": "Trinity Conformance Block Max Grid Compute",
    "provider":{
        "type":"docker",
        "concurrency": "1",
        "queue": "docker-local"
    },
    "plugins": ["max-grid-plugin-manifest.json"],
    "event":{
        "compute-manifests":["max-grid-compute-manifest.json"]
    },
    "generator":{
        "type":"array2",
        "start":1,  //start and end refer to block numbers.  We are starting on block 1
        "end":4,    //we are ending on block 4
        "perEventLoop":[ //for each block, we will create jobs for these three models
            {"MODEL_PREFIX":"bardwell-creek"},
            {"MODEL_PREFIX":"chambers-creek"},
            {"MODEL_PREFIX":"mill-creek"}
        ],
        "addEnv":{
            "BLOCK_EVENTS":"block-ams-contributing-events.txt"
        }
    },
    "secrets-manager":{ //only used to mock out a secrets manager for the local docker provider
        "type": "env",
        "secrets":{
            "secretsmanager:AWS_ACCESS_KEY_ID::":"AWS_ACCESS_KEY_ID",
            "secretsmanager:AWS_SECRET_ACCESS_KEY::":"AWS_SECRET_ACCESS_KEY"
        }
    }
}
```
### Running the plugin
To run the plugin perform the following steps
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
  3) open a command line into the directory
  4) run the following command:
  ```bash
  >> cccli -e={path to your environment file} run
  ```
  
  for a successful run, you should see output similar to this:
  ```txt
    
  ```