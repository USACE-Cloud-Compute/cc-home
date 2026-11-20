## Hydraulics Postprocessor
The hydraulics postprocessor is used to export plan data computed with RAS6 to depth, velocity, or water-surface grids.

## Export Grid Action documentation


### Plugin Manifest


### Compute Manifest
We need a compute manifest to define the actual compute job variables and actions. Referring to the "compute-manifest.json" for this tutorial run, we will need the following:

```json
{
	"manifest_name": "grid-generation",  //user defined.  Set this to any name you like.
	"plugin_definition": "cc-ras-postprocess",  //this must match the name from the ras-postprocessor-plugin-manifest
	"job_timeout": 14400, //optional job timeout in seconds
	"stores": [
		{
			"name": "FFRD",  //name of the store.  This is defined by the plugin author.
			"store_type": "S3", //type of store.  S3 for this tutorial
			"profile": "FFRD", //the profile prefix that will be used to extract the environment variable configuration.
			"params": {
				"root": "model-library/ffrd-trinity",
				"retries": 100
			}
		}
	],
	"inputs": {
		"payload_attributes": {		
			"geom": "01",
            "plan": "01",
			"gridOutputDirectory": "grids/{ENV::MODEL_PREFIX}",
			"rasMapperFilePath": "conformance/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.rasmap",
			"resultsName": "SST.h5",
			"scenario": "conformance",
			"storeTerrainPath": "terrain-mapping/{ENV::MODEL_PREFIX}",
			"terrainFile": "{ENV::TERRAIN_FILE}"
		},
		"data_sources": [
			{
				"name": "common-model-files", //RAS model files
				"paths": {
					"prj": "{ATTR::scenario}/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.prj",
					"rasmap": "{ATTR::rasMapperFilePath}",
					"ic-file": "{ATTR::scenario}/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.ic.o{ATTR::plan}",
					"b-file": "{ATTR::scenario}/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.b{ATTR::geom}",
					"geom": "{ATTR::scenario}/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.g{ATTR::geom}.hdf",
					"p-file": "{ATTR::scenario}/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.p{ATTR::plan}",
					"x-file": "{ATTR::scenario}/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.x{ATTR::plan}"
				},
				"store_name": "FFRD"
			},
			{
				"name": "results-file", //RAS HDF5 output file
				"paths": {
					"default": "{ATTR::scenario}/simulations/event-data/{VAR::eventIdentifier}/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.p{ATTR::plan}.hdf"
				},
				"store_name": "FFRD"
			}
		]
	},
	"outputs": [
		{
			"name": "depth",
			"paths": {
				"default": "{ATTR::scenario}/simulations/event-data/{VAR::eventIdentifier}/{ATTR::gridOutputDirectory}/depth.tif"
			},
			"store_name": "FFRD"
		},
		{
			"name": "velocity",
			"paths": {
				"default": "{ATTR::scenario}/simulations/event-data/{VAR::eventIdentifier}/{ATTR::gridOutputDirectory}/velocity.tif"
			},
			"store_name": "FFRD"
		},
		{
			"name": "watersurface",
			"paths": {
				"default": "{ATTR::scenario}/simulations/event-data/{VAR::eventIdentifier}/{ATTR::gridOutputDirectory}/watersurface.tif"
			},
			"store_name": "FFRD"
		}
	],
	"actions": [
		{
			"name": "export-grids",
			"type": "export",
			"description": "export velocity grid to model library",
			"attributes": {
				"gridCellSize": "9.84",  //3 meters in ft
				"maptypes": ["depth","velocity"],
				"profile": "Max"
			}
		}
	]
}
```


## parameterization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `geom` | Geometry file for the plan being exported | 01
| `plan` | Plan being exported | 01
| `gridOutputDirectory` | Path for the grid output on the remote store relative to the event directory | grids/model1
| `rasMapperFilePath` | Path to the input ras mapper file on the remote store| conformance/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.rasmap
| `resultsName` | ??? | SST.h5
| `scenario` | FFRD scenario name | conformance
| `storeTerrainPath` | Path on the remote store relative to store root for the model terrain folder| terrain-files/model1
| `terrainFile` | Terrain file name | model1-terrain.tif


### Compute file
The compute file effectively links the plugin manifest, compute manifest, and the compute provider together.

```json
{
    "name": "Trinity RAS Extraction Summary",
    "provider": { //this block defines the compute provider
        "type": "docker", //we will use the local docker provider
        "concurrency": 1, //we do not need to run multiple concurrent jobs, so this is set to 1
        "queue": "docker-local" //the local docker provider has a single internal queue defined as "docker-local"
    },
    "plugins": ["ras2025-postprocessor-plugin-manifest.json"],
    "event":{
        "compute-manifests":["compute-manifest.json"]
    },
    "generator":{
        "type": "stream",
        "file": "events-to-export.csv",
        "delimiter": "\n",
        "perEventLoop":[
            {"MODEL_PREFIX":"clear-creek", "TERRAIN_FILE":"clear-creek_terrain_3m.tif"},
            {"MODEL_PREFIX":"ray-roberts", "TERRAIN_FILE":"ray-roberts_terrain_3m.tif"},
            {"MODEL_PREFIX":"lewisville", "TERRAIN_FILE":"lewisville_terrain_3m.tif"}
        ]
    },
    //local docker has a simple in-memory credential management system.
    //it maps environment variables to secretsmanager key names.  
    //for example, in this configuration the env variable AWS_ACCESS_KEY_ID is mapped to a credential manager variable of "secretsmanager:AWS_ACCESS_KEY_ID::".  subsequently, in the plugin manifest configuration, the credential manager value of "secretsmanager:AWS_ACCESS_KEY_ID::" is mapped into the running plugin as FFRD_AWS_ACCESS_KEY_ID
    "secrets-manager": {
        "type": "env",
        "secrets": {
            "secretsmanager:AWS_ACCESS_KEY_ID::": "AWS_ACCESS_KEY_ID",
            "secretsmanager:AWS_SECRET_ACCESS_KEY::": "AWS_SECRET_ACCESS_KEY"
        }
    }
}
```
### Running the hydraulics postprocessor
to run the hydraulics postprocessor perform the following steps
  1) make sure you have set up your local stores and copied the starting set of trinity files into your FFRD store
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
  3) open a command line into the `10-hydraulics-postprocess` directory
  4) run the following command:
  ```bash
  >> cccli -e={path to your environment file} run
  ```
  
  for a successful run, you should see output similar to this:
  ```txt
    
  ```