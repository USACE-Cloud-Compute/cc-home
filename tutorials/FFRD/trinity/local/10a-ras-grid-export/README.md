## RAS Grid Export
After running RAS, the grids can be exported.  Grids are exported with the RAS 2026 plugin.

## RAS Post Processor plugin action documentation
https://github.com/USACE-Cloud-Compute/seed-generator-plugin/blob/main/internal/actions/block-all-seed-generation-action.md

### Plugin Manifest
The plugin manifest for the ras postprocessor is functionally identical to the previous plugins and is documented [here](../1-blockfile-generation/README.md#plugin-manifest).  The tutorial common folder includes a plugin manifest for the ras postprocessor plugin.

### Compute Manifest
We need a compute manifest to define the actual compute job variables and actions. Referring to the "compute-manifest.json" for this tutorial run, we will need the folowing:

```json
{
	"manifest_name": "grid-generation",  //the required manifest name
	"plugin_definition": "cc-ras-postprocess:8", //requested reference to the registered plugin
	"job_timeout": 14400, //optional job timeout in seconds
	"stores": [
		{
			"name": "FFRD", //name of the store.  This is defined by the plugin author.
			"store_type": "S3", //type of store.  S3 for this tutorial
			"profile": "FFRD", //the profile prefix that will be used to extract the environment variable configuration.
			"params": {
				"root": "model-library/ffrd-trinity", //the location on the store that all references will start from
				"retries": 100 //number of retries if file/network access fails
			}
		}
	],
	"inputs": {
		"payload_attributes": {	//effectively "global" level attributes for the plugin.  Any action can access these attributes
			"geom": "01", //the geometry file suffix to use.  Used in the "common-model-files" attribute substitution
			"gridOutputDirectory": "grids/{ENV::MODEL_PREFIX}", //relative output directory for the grid.  used in the output path substitution
			"outputRoot": "production/simulations/event-data", //location for output data.  This is required by the plugin
			"plan": "01", //the plan file suffix to use.  Used in the "common-model-files" attribute substitution
			"rasMapperFilePath": "production/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.rasmap", //relative path to the input ras mapper file (relative to the store root).
			"resultsName": "SST.h5", //the required name of the "results" used by RAS after conversion from RAS6.
			"scenario": "production", //the scenario.  Used in path substitution
			"storeTerrainPath": "terrain-mapping/{ENV::MODEL_PREFIX}", //relative path to the terrian on the store (relative to the store root)
			"terrainFile": "{ENV::TERRAIN_FILE}" //name of the terrain file
		},
		"data_sources": [
			{
				"name": "common-model-files", //the required set of model files necessary to export the grid
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
				"name": "results-file", //the required ras hdf5 plan output
				"paths": {
					"default": "{ATTR::scenario}/simulations/event-data/{VAR::eventIdentifier}/hydraulics/{ENV::MODEL_PREFIX}/{ENV::MODEL_PREFIX}.p{ATTR::plan}.hdf"
				},
				"store_name": "FFRD"
			}
		]
	},
	"outputs": [
		{
			"name": "depth", //the depth grid output location.  Required if a depth grid is selected for export
			"paths": {
				"default": "{ATTR::scenario}/simulations/event-data/{VAR::eventIdentifier}/{ATTR::gridOutputDirectory}/depth.tif"
			},
			"store_name": "FFRD"
		},
		{
			"name": "velocity", //the velocity grid output location. Required if a velocity grid is selected for export
			"paths": {
				"default": "{ATTR::scenario}/simulations/event-data/{VAR::eventIdentifier}/{ATTR::gridOutputDirectory}/velocity.tif"
			},
			"store_name": "FFRD"
		},
		{
			"name": "watersurface", //the watersurface grid output location. Required if a watersurface grid is selected for export
			"paths": {
				"default": "{ATTR::scenario}/simulations/event-data/{VAR::eventIdentifier}/{ATTR::gridOutputDirectory}/watersurface.tif"
			},
			"store_name": "FFRD"
		}
	],
	"actions": [
		{
			"name": "export-grids", //the required name of the action
			"type": "export", //the optional type of the action
			"description": "export velocity grid to model library", //optional description for the action
			"attributes": {
				"gridCellSize": "9.81", //required output grid cell size in the units of the ras project
				"maptypes": ["depth","velocity"], //the set of grids to export.  One of more of "depth", "velocity", and "watersurface".
				"profile": "Max" //the ras command line "profile" parameter.  Max or time series
			}
		}
	]
}
```


### Compute file
The compute file effectively links the plugin manifest, compute manifest and compute provider together.

```json
{
    "name": "RAS Grid Export",
    "provider": { //this block defined the compute provider
        "type": "docker", //we will use the local docker provider
        "concurrency": 1, //we do not need to run multiple concurrent jobs, so this is set to 1
        "queue": "docker-local" //the local docker provider has a single internal queue defined as "docker-local"
    },
    "plugins": [
        "../common/ras-postprocessor-plugin-manifest.json" //reference to the plugin manifest
    ],
    "event": {
        "compute-manifests": [
            "compute-manifest.json" //reference to the compute manifest
        ]
    },

    //the ras grid export plugin is designed to operate on batches of events from a single running instance
    //the event sets are batched in the runevents.csv file and each instance of the plugin will process a single row
    //of events from the runevents.csv file.  A "per-event-loop" is configured so that for each set of batched events
    //a separate insance of the grid export will be created for each of the three models (clear-creek, ray-roberts, and lweisville)
    //the per-event-loop will also inject the terrain file environment variable into the plugin when it is run
    "generator":{
        "type": "stream",
        "file": "runevents.csv",
        "delimiter": "\n",
        "perEventLoop":[
            {"MODEL_PREFIX":"clear-creek", "TERRAIN_FILE":"clear-creek_terrain_3m.tif"},
            {"MODEL_PREFIX":"ray-roberts", "TERRAIN_FILE":"ray-roberts_terrain_3m.tif"},
            {"MODEL_PREFIX":"lewisville", "TERRAIN_FILE":"lewisville_terrain_3m.tif"}
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


### Running the ras postprocessor
to run the ras postprocessor perform the following steps
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
  3) open a command line into the `ras-grid-export` directory
  4) run the following command:
  ```bash
  >> cccli -e={path to your environment file} run
  ```
  
  for a successful run, you should see output similar to this:
  ```txt
    
  ```