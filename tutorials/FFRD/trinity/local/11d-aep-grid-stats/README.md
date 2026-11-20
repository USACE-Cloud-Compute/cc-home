## Realization Grid Stats
After AEP and Frequency grids are computed for each realization, the raster algebra tool is used to calculate mean and standard deviation grids across all of the realizations.

## Realization Grid Stats Action documentation
This tool is using the Raster Algebra action: https://github.com/USACE-Cloud-Compute/aggregator/blob/main/actions/raster-algebra-action.md

### Plugin Manifest
The creation of a plugin manifest for the aggregator plugin is documented [here](../1-blockfile-generation/README.md#plugin-manifest).

### Compute Manifest
We need a compute manifest to define the actual compute job variables and actions. Referring to the "compute-manifest.json" for this tutorial run, we will need the following:

```json
{
    "manifest_name":     "trinity-conformance-max-grid",
    "plugin_definition": "CC-AGGREGATOR-PLUGIN:9",
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
            "gridType":"depth"
        }
    },
    "actions": [
       {
            "name": "raster-algebra",
            "type": "raster-algebra",
            "description": "raster algebra",
            "attributes":{
                "grids": [
                    "/vsis3/ffrd-computable/model-library/ffrd-trinity/production/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/aep_{ATTR::gridType}_realz_1.tif",
                    "/vsis3/ffrd-computable/model-library/ffrd-trinity/production/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/aep_{ATTR::gridType}_realz_2.tif",
                    "/vsis3/ffrd-computable/model-library/ffrd-trinity/production/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/aep_{ATTR::gridType}_realz_3.tif",
                    "/vsis3/ffrd-computable/model-library/ffrd-trinity/production/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/aep_{ATTR::gridType}_realz_4.tif",
                    "/vsis3/ffrd-computable/model-library/ffrd-trinity/production/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/aep_{ATTR::gridType}_realz_5.tif"
                ],
                "gridOut": "production/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/stdev_aep_{ATTR::gridType}.tif",
                "loadingConcurrency": 5,
                "rasterAlgebraFunction":"stdev",
                "noDataComputeSubstitutionValue":0.0,
                "copyLocal":true
            }
        }
    ]
}
```


## Parameterization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `gridType` | Grid type to process.  Usually either depth or velocity | depth
| `grids` | GDAL path to each realization grid | /vsis3/ffrd-computable/model-library/ffrd-trinity/production/simulations/summary-data/aep-grids/model1/aep_depth_realz_1.tif
| `gridOut` | Path for the grid output on the remote store relative to the remote store| production/simulations/summary-data/aep-grids/model1/mean_aep_depth.tif
| `loadingConcurrency` | Number of grids that will be loaded and processed in parallel| 5
| `rasterAlgebraFunction` | "stdev" or "mean" | stdev
| `noDataComputeSubstitutionValue` | depth or velocity value used when a no-data (-9999) is read from a grid | 0.0
| `copyLocal` | when true copies the grids to the local block and processes locally.  When false reads the input grids directly from the grids array paths.  If set to true, make sure you have enough space locally on the block to store copies of the grids.  Local processing will result in better performance.| true


### Compute file
The compute file effectively links the plugin manifest, compute manifest and compute provider together.
  - the array generator start and stop values are both set to 1. The array generator is only used to loop over the perEventLoop models.

```json
{
    "name": "Trinity Conformance AEP Realization stats",
    "provider":{
        "type":"awsbatch",
        "execution-role": "ecsTaskExecutionRole",
        "region": "us-gov-west-1",
        "profile": "ffrd_compute",
        "queue": "CC_QUEUE_ARM"
    },
    "plugins": ["aggregator-plugin-manifest.json"],
    "event":{
        "compute-manifests":["aep-grid-stats-compute-manifest.json"]
    },
    "generator":{
        "type":"array",
        "start":1, //running an array type for the perEventLoop.  Event identifier is not used in this compute
        "end":1, //start and end are both set to 1 so that we just enumerate the perEventLoop
        "perEventLoop":[
            {"MODEL_PREFIX":"clear-creek", "DEBUG_CELL":"15732,13773"},
            {"MODEL_PREFIX":"lewisville", "DEBUG_CELL":"5831,11459"},
            {"MODEL_PREFIX":"ray-roberts", "DEBUG_CELL":"14439,8626"}
        ]
    }
}
```
### Running the plugin
to run the plugin perform the following steps
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