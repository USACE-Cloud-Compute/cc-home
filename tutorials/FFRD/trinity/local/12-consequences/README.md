### consequences-runner

The consequences-runner provides capability to compute consequences for a flood hazard for a user provided structure inventory.

## Plugin
The consequences-runner is the plugin.

## Action Parameterization
Production consequences relies on the action in the consequences-runner plugin named "compute-fema-frequency-single-parameter" all input parameters are defined in the action's attributes. The action produces a estimate of EAD with uncertainty utilizing the standard deviations and means of the standard frequency hazard grids to drive uncertainty (uncertainty in hazard). This compute is to produce consequences for production.

# Attributes
	- tablename : the table name inside of the geospatial dataset for the structure inventory.
	//vsis3prefix := a.Parameters.GetStringOrFail(vsis3prefixKey)
	- depthGridPathString : a comma-space ", " separated value of depth grid paths as a single string        // expected each path is a vsis3 object if computing locally or remotely.
	- frequencystring : a comma- space ", " separated value of frequencies corresponding in order with the hazard grids provided.// frequencies expected to be comma separated variables of floats.
	- vertical-slices : a comma-space ", " separated value of probabilities that will make slices at each frequency to represent the uncertainty in the input hazard. these must be evenly spaced because they are summed with 1/n weighting.
	- inventoryPathKey : a local path to a structure inventory file (used in conjuntion with the copy local action that copies payload level inputs locally prior to execution of this action) //expected this is local - needs to agree with the payload input datasource name
	- inventoryDriver : a string representing the OGR driver type for the inventory could be GPKG, SHP, or PARQUET or any valid OGR driver type.
	- outputDriver := a string representing the OGR driver type for the output could be GPKG, SHP, or PARQUET or any valid OGR driver type.
	- outputFileName :  a local path to the output destination, used in conjunction with the copy to remote action that must be added after this compute action completes. //expected this is local - needs to agree with the payload output datasource name
	- damageFunctionPath := a path to a damage function set that the user wishes to use with the inventory //expected this is local - needs to agree with the payload input datasource name
	

 ## Steps to compute


 ```json
 {
	"manifest_name": "production-consequences",//user provided name.
	"plugin_definition": "FFRD-CONSEQUENCES",//plugin name from the plugin manifest in common.
	"stores": [{//global stores.
		"name": "FFRD",//store name used by datasources to define what store they associate with
		"store_type": "S3",//store type, S3 Simple Storage System represents an object store in the case of this local tutorial that is being mocked with minio.
		"profile": "FFRD",//the profile is used to associate this store with secrets for access.
		"params": {
			"root": "model-library/ffrd-trinity"//the root of the store.
		}
	}],
	"inputs": {//global inputs consisting of global attributes and global input data sources. 
		"payload_attributes": {//global attributes
            "scenario": "production",//an attribute scenario to allow for chaning from production to conformance or vice versa.
			"inventory": "nsi_2025"//an attribute inventory to allow for ease in changing from nsi version to nsi version, or to change from nsi to milliman books.
        },
		"data_sources": [//global input data sources (these will be copied in with the copy-inputs action)
			{
				"name": "{ENV::MODEL_PREFIX}.gpkg",//the name of the datasource representing the structure inventory, notice the model unit is coming from an environment varialbe so that many different model units can be processed from one manifest.
				"paths": {"default":"{ATTR::scenario}/consequences/{ATTR::inventory}/{ENV::MODEL_PREFIX}.gpkg"},//the path to the structure inventory.
				"store_name": "FFRD"//the store that the structure inventory resides within
			},{
				"name": "Inland_FFRD_damageFunctions.json",//the name of the datasource for the damage functions (can be any name.)
				"paths": {"default":"{ATTR::scenario}/consequences/Inland_FFRD_damageFunctions.json"},//the path to the damage functions 
				"store_name": "FFRD"//the name of the store where the damage functions reside.
			}
		]
	},
	"outputs": [{//global outputs, will be put in the store by the post-outputs action
		"name": "{ENV::MODEL_PREFIX}_consequences",//the name of the output
		"paths": {"default":"{ATTR::scenario}/simulations/summary-data/consequences/{ENV::MODEL_PREFIX}_consequences.gpkg"},//the desired destination path.
		"store_name": "FFRD"//the desired store where outputs should be put
	}],
	"actions": [{//the list of actions, which will happen in order.
			"name": "copy-inputs",//copy inputs will copy all globally defined input datasources to the local container 
			"type": "utils",//a type
			"description": "copy-inputs"//a description.
		},
		{
			"name": "compute-fema-frequency-single-parameter",//the name of the action to compute frequency based results for a single parameter (depth) and compute uncertainty based on the incoming hazard grids using normally distributed error.
			"type": "compute",//a type.
			"description": "computing frequency based losses with hydraulic uncertainty",//a description.
			"attributes": {//action level attributes.
				"tableName":        "nsi",//the name of the table within the inventory dataset.
				"Inventory":        "/app/data/{ENV::MODEL_PREFIX}.gpkg",//the local path to the inventory (after the copy inputs action completes.)
				"inventoryDriver":  "GPKG",//the ogr dataset type.
				"mean-depth-grids":       "/vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/mean_aep_depth_10yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/mean_aep_depth_20yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/mean_aep_depth_50yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/mean_aep_depth_100yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/mean_aep_depth_200yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/mean_aep_depth_500yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/mean_aep_depth_1000yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/mean_aep_depth_2000yr.tif",//the comma-space ", " separated paths using vsis3 nominclature for the tifs by frequency, the count of mean depth grids must match the count of stdev depth grids, and the count of the list of frequencies.
				"stdev-depth-grids":       "/vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/stdev_aep_depth_10yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/stdev_aep_depth_20yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/stdev_aep_depth_50yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/stdev_aep_depth_100yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/stdev_aep_depth_200yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/stdev_aep_depth_500yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/stdev_aep_depth_1000yr.tif, /vsis3/ffrd-computable/model-library/ffrd-trinity/{ATTR::scenario}/simulations/summary-data/aep-grids/{ENV::MODEL_PREFIX}/stdev_aep_depth_2000yr.tif",//the stdev grid paths.
				"frequencies": "0.1, 0.05, 0.02, 0.01, 0.002, 0.005, 0.0002, 0.0005",//the frequencies. the count of frequencies must match the count of grids, each frequency should represent the frequency of the grid (using oridnal positioning). 
				"vertical-slice": "0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9",//the vertical slices to sample the normal distribution of error in the hazard at each frequency.
				"outputDriver":     "GPKG",//the desired output driver as ogr driver short name.
				"outputFileName":   "/app/data/{ENV::MODEL_PREFIX}_consequences.gpkg",//output file path locally. extension should match with the correct extension defined by the output driver.
				"damage-functions": "/app/data/Inland_FFRD_damageFunctions.json"//local path to the damage functions (after copy inputs is complete.)
			}
		},{
			"name": "post-outputs",//action to post outputs defined in the global outputs..
			"type": "utils",//a type.
			"description": "post-outputs"//a description.
		}
	]
}
 ```