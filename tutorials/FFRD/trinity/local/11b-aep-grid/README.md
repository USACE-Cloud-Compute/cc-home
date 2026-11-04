## AEP Grids
compute Annual Exceedance Probability from the block annual maximum

## Export AEP Grid Action documentation
https://github.com/USACE-Cloud-Compute/aggregator/blob/main/actions/ep-grids-action.md

### Plugin Manifest
The creation of a plugin manifest for the aggregator plugin is documented [here](../1-blockfile-generation/README.md#plugin-manifest).



### Compute Manifest
We need a compute manifest to define the actual compute job variables and actions. Referring to the "compute-manifest.json" for this tutorial run, we will need the following:

```json
{
    "manifest_name":     "trinity-aep-grid",
    "plugin_definition": "CC-AGGREGATOR-PLUGIN",
    "resource_requirements":[
        {
            "resource_type":  "VCPU",
            "value": "8"
        },
        {
            "resource_type":  "MEMORY",
            "value": "28000"
        }
    ],
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
		"payload_attributes": {		
			"scenario": "production",
            "gridType": "depth"
		}
    },
    "actions":[
        {
            "name":        "ep-grids",
            "type":        "ep-grids",
            "description": "epgrids",
            "attributes": {
                "gridNumber":0,
                "blockStart": 1,
                "blockEnd":2000,
                "gdalVsisPrefix": "/vsis3/ffrd-computable/model-library/ffrd-trinity",
                "baseValueGrid":"{ATTR::scenario}/simulations/summary-data/base-grids/{ENV::MODEL_PREFIX}/base-{ATTR::gridType}.tif",
                "gridPathTemplate":   "{ATTR::scenario}/simulations/summary-data/max-grids/{ENV::MODEL_PREFIX}/max_realz_{ENV::CC_EVENT_IDENTIFIER}_block_{VAR::block}_{ATTR::gridType}.tif",
                "processingConcurrency": 5,
                "probOutTemplate":    "{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/aep_{ATTR::gridType}_realz_{ENV::CC_EVENT_IDENTIFIER}.tif",
                "debugOutTemplate": "{ATTR::scenario}/simulations/summary-data/aep-grids/qc/{ENV::MODEL_PREFIX}/aep_{ATTR::gridType}_realz_{ENV::CC_EVENT_IDENTIFIER}_debug_{VAR::debugCellX}_{VAR::debugCellY}.csv",
                "thresholds": [0.00001]
            }
        }
    ]  
}
```


## Parameterization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `gridNumber` | GridNumber is the total number of grids to be processed (used in probability calculation). User can optionally provide a number to override but if not, the GridNumber is the number of grids processed.  Set this value to 0 (use the grid count) or omit it. | 0
| `blockStart` | starting block number | 1
| `blockEnd` | ending block number | 2000
| `gdalVsisPrefix` | GDAL specific path to the directory location for grids.  Although the name implies this is a gdal VSIS path, it supports any valid GDAL path prefix. | /vsis3/ffrd-computable/model-library/ffrd-trinity
| `baseValueGrid` | GRID representing a base flow value used in the circumstance that a block had no AMS contributing events | "conformance/simulations/summary-data/base-grids/model1/base-depth.tif".  Using these example values, the full base flow path is this value combined with the gdalVsisPrefix which results in "/vsis3/ffrd-computable/model-library/ffrd-trinity/conformance/simulations/summary-data/base-grids/model1/base-depth.tif"
| `gridPathTemplate` | Template to each block annual maximum grid.  This is combined with the gdalVsisPrefix for the full path.| "{ATTR::scenario}/simulations/summary-data/max-grids/{ENV::MODEL_PREFIX}/max_realz_{ENV::CC_EVENT_IDENTIFIER}_block_{VAR::block}_{ATTR::gridType}.tif" which would result in a full path of "/vsis3/ffrd-computable/model-library/ffrd-trinity/conformance/simulations/summary-data/max-grids/model1/max_realz_1_block_10_depth.tif" for the Conformance scenario, model1, realization 1, block 10, depth grid. 
| `processingConcurrency` | Number of grids that will be processed in parallel| 5
| `probOutTemplate` | output location from the FFRD store root. | "conformance/simulations/summary-data/aep-grids/model1/aep_depth_realz_1.tif" for conformance, model1, depth grid, realization 1.
| `debugOutputTemplate` | output location for AEP debug data. This will write out values for each block maximum grid at a coordinate location and can be used to validate statistics.| "conformance/simulations/summary-data/aep-grids/qc/model1/aep_depth_realz_1_debug_10000_20000.csv" for conformance, model1, depth grid, realization 1, cell X debug value of 10000, and cell Y debug value of 20000.
| `thresholds` | An array of threshold values to compute. For FFRD this should be an array with a single value representing values greater than 0 or no-data | [0.00001]


### Compute file
The compute file effectively links the plugin manifest, compute manifest and compute provider together.  For AEP Grid Generation
  - the array generator start and stop values represent Realizations.  In the example below it is starting at realization 1 and ending after realization 5.
  - per event loops are used to process each model for every realization.  The per event loop requires a MODEL_PREFIX, but the DEBUG_CELL is optional.


```json
{
    "name": "Trinity AEP Grid Compute",
    "provider":{
        "type":"docker",
        "concurrency": "1",
        "queue": "docker-local"
    },
    "plugins": ["aggregator-plugin-manifest.json"],
    "event":{
        "compute-manifests":["compute-manifest.json"]
    },
    "generator":{
        "type":"array",
        "start":1, //this is the realization number.  We will start at realization 1
        "end":5, //end at realization 5
        "perEventLoop":[
            {"MODEL_PREFIX":"clear-creek", "DEBUG_CELL":"15732,13773"},
            {"MODEL_PREFIX":"lewisville", "DEBUG_CELL":"5831,11459"},
            {"MODEL_PREFIX":"ray-roberts", "DEBUG_CELL":"14439,8626"}
        ]
    },
    "secrets-manager":{
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