### consequences-runner

The consequences-runner provides capability to compute consequences for a flood hazard for a user provided structure inventory.

## Plugin
The consequences-runner is the plugin.

## Action Parameterization
Production consequences relies on the action in the consequences-runner plugin named "compute-fema-frequency-single-parameter" all input parameters are defined in the action's attributes. The action produces a estimate of EAD with uncertainty utilizing the standard deviations and means of the standard frequency hazard grids to drive uncertainty (uncertainty in hazard). This compute is to produce consequences for production.

# Attributes
	- tablename : the table name inside of the geospatial dataset for the structure inventory.
	//vsis3prefix := a.Parameters.GetStringOrFail(vsis3prefixKey)
	- depthGridPathString : a comma separated value of depth grid paths as a single string        // expected this is a vsis3 object if computing locally
	- velocityGridPathString := a comma separated value of velocity grid paths as a single string        // expected this is a vsis3 object if computing locally, if omitted no velocity is used for compute.
	- frequencystring : a comma separated value of frequencies corresponding in order with the hazard grids provided.// frequencies expected to be comma separated variables of floats.
	- inventoryPathKey : a local path to a structure inventory file (used in conjuntion with the copy local action that copies payload level inputs locally prior to execution of this action) //expected this is local - needs to agree with the payload input datasource name
	- inventoryDriver : a string representing the OGR driver type for the inventory could be GPKG, SHP, or PARQUET or any valid OGR driver type.
	- outputDriver := a string representing the OGR driver type for the output could be GPKG, SHP, or PARQUET or any valid OGR driver type.
	- outputFileName :  a local path to the output destination, used in conjunction with the copy to remote action that must be added after this compute action completes. //expected this is local - needs to agree with the payload output datasource name
	- damageFunctionPath := a path to a damage function set that the user wishes to use with the inventory //expected this is local - needs to agree with the payload input datasource name
	

 ## Steps to compute


 