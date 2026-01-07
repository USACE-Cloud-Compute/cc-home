## Hydraulics Run
The purpose of this series of compute manifests is to run two parallel HEC-RAS models that feed into a downstream HEC-RAS model.

The models ray-roberts and clear-creek are headwater HEC-RAS models with no upstream RAS model dependencies, they depend only on HEC-ResSim, HEC-HMS, and fragility curve sampling. 

The lewisville RAS model is dependent on clear-creek and ray-roberts and is set to run when they complete.

Each RAS model has a slightly different configuration of actions, but all three have a few actions in common. 
* copy-inputs
* update-breach-bfile
* compute-unsteady
The action copy-inputs copies all inputs locally, update-breach-bfile updates the b file to contain the sampled breach trigger elevaitons for levees and dams, and the compute unsteady action computes an unsteady simulation.

Both ray-roberts and lewisville have an additional action in common
* update-outlet-ts-bfile
This action updates the bfile with the previously stored time series of regulated flows set in the hdf file. RAS 6x branch reads time series overrides for 2d structures from the b file not the HDF file. 

The lewisville model has an action for each upstream model it is dependent upon to move the refline output timeseries into bcline input time series to pass flow into lewisville from clear-creek and ray-roberts.
* refline-to-bcline

All three models have the follwing extract actions as well.
* extract bcline peak flow and stage
* extract refline peak flow
* extract refline peak wsel
* extract refpoint peak velocity
* extract refpoint peak wsel
* extract structure variable peaks
* extract summary attributes
* extract 2dSA summary attributes
* extract breach summary data

## Relevant Actions documentation
https://github.com/USACE/cc-ras-runner/blob/main/actions/utils/copy-inputs-action.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/link/update-breach-data.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/link/update-outletts-data.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/link/refline-to-bc.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/run/unsteady-simulation.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/extract/hdf/ras-extract-action.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/extract/hdf/ras-breach-action.md

## parametrization for the tutorial
# copy-inputs
This copies all payload level inputs into the container.
| Attribute | Description | Value |
|-----------|----------|-------------|
| not applicable | |
# update-breach-bfile
This reads the hdf file for the Sid names of the 2d connections, reads the fragility curve samples, and writes the breach trigger elevations to the bfile accordingly.
| Attribute | Description | Value |
|-----------|----------|-------------|
| bFile | the b file for the model | clear-creek.b01
| fcFile | the failure elevations samples for the event | failure_elevations.json
| geoHdfFile | the hdf file with geometry inside it (we use the p01.tmp.hdf file)  | clear-creek.p01.tmp.hdf
# update-outlet-ts-bfile
This copies the data stored in hdf from HEC-HMS or HEC-RESSIM in the tmp hdf describing the hourly releases for a structure into the bfile (where RAS actually reads it from during compute).
| Attribute | Description | Value |
|-----------|----------|-------------|
| bFile | the b file for the model | clear-creek.b01
| hdfDataPath | the path to the specific 2d connection with ts outflow overrides | Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/SA Conn: nid_tx08008 (Outlet TS: USGS08051135)
| hdfFile | the hdf file with inserted outflow data | ray-roberts.p01.tmp.hdf
| outletTS | the name of the outlet (should match with the b file and the hdf file) | SA Conn: nid_tx08008 (Outlet TS: USGS08051135)
# refline-to-boundary-condition
This copies data from a computed HEC-RAS model (upstream) and pushes it to the correct location in the ras model about to be computed. The remote hdf file is accessed via a remote call to the bytes of the time series for the refline, so the upstream hdf file (which is large) does not have to be copied local to this container
| Attribute | Description | Value |
|-----------|----------|-------------|
| refline | the refline in the source hdf file per sop naming convention |'clear-creek_to_lewisville|clear-creek'

# action level input data sources
| Input Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| source | hdf | conformance/simulations/event-data/{ENV::CC_EVENT_IDENTIFIER}/hydraulics/clear-creek/clear-creek.p01.hdf |  refline | Results/Unsteady/Output/Output Blocks/DSS Hydrograph Output/Unsteady Time Series/Reference Lines |

# action level output data sources
| Output Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| destination | hdf | lewisville.p01.tmp.hdf | bcline | Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: Lewisville BCLine: clear-creek_to_lewisville |

## required inputs

| Datasource Name | Path Key | Path Value (resolved from substitution) |
|-----------|----------|-------------|
| clear-creek.p01.tmp.hdf | tmp_hdf | /conformance/simulations/event-data/{ENV::CC_EVENT_IDENTIFIER}/hydraulics/clear-creek/clear-creek.p01.tmp.hdf |
| clear-creek.p01.tmp.hdf | b_file | /conformance/hydraulics/clear-creek/clear-creek.b01 |
| clear-creek.p01.tmp.hdf | o_file | /conformance/hydraulics/clear-creek/clear-creek.ic.o01  |
| clear-creek.p01.tmp.hdf | x_file | /conformance/hydraulics/clear-creek/clear-creek.x01  |
| failure_elevations.json | failure_elevations | /conformance/simulations/event-data/{ENV::CC_EVENT_IDENTIFIER}/system-response/failure_elevations.json |

Example Lewisville compute manifest (the most difficult one) with comments 
```json
{
    "manifest_name": "compute-ras-lewisville",//user provided name
    "plugin_definition": "CC-RAS-PLUGIN:1",//plugin reference to the registered plugin
    "stores": [//global stores
        {
            "name": "FFRD",//name of the store used by datasources to refer to the store
            "store_type": "S3",//type of S3 Simple Storage System in the tutorial we will use minio to mock S3
            "profile": "FFRD",//profile name is used to associate secrets with the stores for authentication.
            "params": {
                "root": "model-library/ffrd-trinity"//the root of the store.
            }
        }
    ],
    "inputs": { //global input data.
        "data_sources": [//global input data sources
            {//a datasource representing the necessary files for a ras model.
                "name": "{ATTR::modelPrefix}.p{ATTR::plan}.tmp.hdf",//a name.
                "paths": {
                    "b_file": "{ATTR::scenario}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix}/{ATTR::modelPrefix}.b{ATTR::geom}",//the b file,
                    "o_file": "{ATTR::scenario}/{ATTR::base-hydraulics-directory}{ATTR::modelPrefix}/{ATTR::modelPrefix}.ic.o{ATTR::plan}",//the o file
                    "tmp_hdf": "{ATTR::scenario}/{ATTR::outputdir}/event-data/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix}/{ATTR::modelPrefix}.p{ATTR::plan}.tmp.hdf",//the tmp hdf file.
                    "x_file": "{ATTR::scenario}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix}/{ATTR::modelPrefix}.x{ATTR::plan}"//the x file. 
                },
                "store_name": "FFRD"
            },
            {
                "name": "failure_elevations.json",//the failure elevations file representing trigger elevation stages for all sampled structures for the specific event.
                "paths": {
                    "failure_elevations": "{ATTR::scenario}/{ATTR::outputdir}/event-data/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-system-response-directory}/failure_elevations.json"//a path to the event specific failure elevations.
                },
                "store_name": "FFRD"//store where the data lives.
            }
        ],
        "environment": [//global input environment variables. 
            {
                "name": "HDF_AWS_S3_TEMPLATE",//the hdf aws s3 template is used for remote reads of hdf 
                "value": "https://%s.s3.us-gov-west-1.amazonaws.com/%s/%s"//this patter is necessary to override the default behavior of hdf remote reads when on gov cloud. (probably needs to be removed for the tutorial tbh.)
            }
        ],
        "payload_attributes": {//global input attributes
            "base-hydraulics-directory": "hydraulics",//the base hydraulics directory
            "base-system-response-directory": "system-response",//the base system response directory
            "geom": "01",//the geometry number
            "modelPrefix": "lewisville",//the model prefix
            "twoDSA": "Lewisville",//the twoD storage area name.
            "modelPrefix_1": "clear-creek",//input model prefix 1
            "modelPrefix_2": "ray-roberts",//input model prefix 2.
            "outputdir": "simulations",//the output directory
            "plan": "01",//base plan number
            "plan_1": "01",//plan number from input model prefix 1
            "plan_2": "01",//plan number from input model prefix 2
            "scenario": "conformance"//scenario (conformance or production.)
        }
    },
    "outputs": [//global outputs
        {
            "name": "{ATTR::modelPrefix}.p{ATTR::plan}.tmp.hdf",//a name
            "paths": {
                "0": "{ATTR::scenario}/{ATTR::outputdir}/event-data/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix}/{ATTR::modelPrefix}.p{ATTR::plan}.hdf"//the event specific model specific output hdf file.
            },
            "store_name": "FFRD"//the store destination.
        },
        {
            "name": "rasoutput",//the name rasoutput is used to store the log file.
            "paths": {
                "0": "{ATTR::scenario}/{ATTR::outputdir}/event-data/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix}/rasoutput.log"//the path to where to store the log file for this event.
            },
            "store_name": "FFRD"//the store name.
        },
        {
            "name": "event_summary",//the event summary datasource name (defined in the actions for summarization too.)
            "paths": {
                "extract": "{ATTR::scenario}/{ATTR::outputdir}/event-data/{ENV::CC_EVENT_IDENTIFIER}/hydraulics/{ATTR::modelPrefix}/ras-event-summary.json"//path to where to store the event level summary data.
            },
            "store_name": "FFRD"//store name.
        }
    ],
    "actions": [//a list of actions to perform in order.
        {
            "attributes": {},
            "description": "copy-files",
            "inputs": [],
            "name": "copy-inputs",//copy inputs copies inputs defined in the global input datasources to the local directory of the container.
            "outputs": [],
            "stores": [
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ],
            "type": "utils"
        },
        {
            "name": "refline-to-boundary-condition",//refline to boundary condition pulls refline timeseries from a remote hdf file for a given refline and puts it into the local hdf file as a bc line input.
            "description": "updating bclines based on upstream ras reflines",
            "attributes": {
                "refline": "clear-creek_to_lewisville|clear-creek"//the specific refline name to look up ouptut from.
            },
            "inputs": [
                {
                    "name": "source",//the input datasource hdf file.
                    "paths": {
                        "hdf": "{ATTR::scenario}/{ATTR::outputdir}/event-data/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix_1}/{ATTR::modelPrefix_1}.p{ATTR::plan_1}.hdf"//a path to the event specific remote hdf file for model prefix 1.
                    },
                    "data_paths": {
                        "refline": "Results/Unsteady/Output/Output Blocks/DSS Hydrograph Output/Unsteady Time Series/Reference Lines"//the refline base location (the name of the specific refline provided as an attribute is used to look up the data in the table.)
                    },
                    "store_name": "FFRD"//the store name
                }
            ],
            "outputs": [
                {
                    "name": "destination",//the destination hdf file (the local hdf file)
                    "paths": {
                        "hdf": "{ATTR::modelPrefix}.p{ATTR::plan}.tmp.hdf"//a local name of the hdf (after being copied to the local directory)
                    },
                    "data_paths": {
                        "bcline": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: Lewisville BCLine: clear-creek_to_lewisville"//the bc line to update
                    },
                    "store_name": "FFRD"
                }
            ],
            "stores": [//a local copy of the store.
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ],
            "type": "link"//a type of the action.
        },
        {
            "name": "refline-to-boundary-condition",//another refline to boundary condition action, this model has two upstream ras models providing input, so the action is performed twice each time pointing to different files and reflines/bclines.
            "description": "updating bclines based on upstream ras reflines",
            "attributes": {
                "refline": "ray-roberts_to_lewisville_1|ray-roberts"
            },
            "inputs": [
                {
                    "name": "source",
                    "paths": {
                        "hdf": "{ATTR::scenario}/{ATTR::outputdir}/event-data/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix_2}/{ATTR::modelPrefix_2}.p{ATTR::plan_2}.hdf"
                    },
                    "data_paths": {
                        "refline": "Results/Unsteady/Output/Output Blocks/DSS Hydrograph Output/Unsteady Time Series/Reference Lines"
                    },
                    "store_name": "FFRD"
                }
            ],
            "outputs": [
                {
                    "name": "destination",
                    "paths": {
                        "hdf": "{ATTR::modelPrefix}.p{ATTR::plan}.tmp.hdf"
                    },
                    "data_paths": {
                        "bcline": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: Lewisville BCLine: ray-roberts_to_lewisville_1"
                    },
                    "store_name": "FFRD"
                }
            ],
            "stores": [
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ],
            "type": "link"
        },
        {//a third instance of upstream boundary conditions coming from an upstream model refline. This time it is the ray-roberts hdf but at a different refline, so ray roberts is providing two refline outputs coming into lewisville as two different bclines (allowing for split flow aross model boundaries.)
            "name": "refline-to-boundary-condition",
            "description": "updating bclines based on upstream ras reflines",
            "attributes": {
                "refline": "ray-roberts_to_lewisville_2|ray-roberts"
            },
            "inputs": [
                {
                    "name": "source",
                    "paths": {
                        "hdf": "{ATTR::scenario}/{ATTR::outputdir}/event-data/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix_2}/{ATTR::modelPrefix_2}.p{ATTR::plan_2}.hdf"
                    },
                    "data_paths": {
                        "refline": "Results/Unsteady/Output/Output Blocks/DSS Hydrograph Output/Unsteady Time Series/Reference Lines"
                    },
                    "store_name": "FFRD"
                }
            ],
            "outputs": [
                {
                    "name": "destination",
                    "paths": {
                        "hdf": "{ATTR::modelPrefix}.p{ATTR::plan}.tmp.hdf"
                    },
                    "data_paths": {
                        "bcline": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: Lewisville BCLine: ray-roberts_to_lewisville_2"
                    },
                    "store_name": "FFRD"
                }
            ],
            "stores": [
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ],
            "type": "link"
        },
        {
            "name": "update-breach-bfile",//this action updates the b file for breach trigger elevations.
            "description": "updating failure elevation triggers",
            "attributes": {
                "bFile": "lewisville.b01",//the b file. (in the local directory from the copy-inputs action)
                "fcFile": "failure_elevations.json",//the failure elevations file (in the local directory from the copy-inputs action)
                "geoHdfFile": "lewisville.p01.tmp.hdf"//here we are using the p01.tmp file as the geoHDF File because the geometry is present in the hdf file so that we did not have to copy the g hdf and the p hdf (minimzing io) (in the local directory from the copy-inputs action)
            },
            "inputs": [],
            "outputs": [],
            "stores": [
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ],
            "type": "link"
        },
        {
            "name": "update-outlet-ts-bfile",//we moved the ressim outflows into the p01.tmp.hdf in the previous manifest, but now we need to move the time series from the hdf file to the b file where it is really read from. We moved it from dss to hdf in the previous manifest so that this plugin (the ras plugin) did not need to have a library to read dss to do the conversion.
            "description": "updating ressim override flows into the b file where the ras exe reads it from",
            "attributes": {
                "bFile": "lewisville.b01",//the local b file. 
                "hdfDataPath": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/SA Conn: nid_tx00008 (Outlet TS: LW Outlet #1)",//the hdf data path.
                "hdfFile": "lewisville.p01.tmp.hdf",//the local hdf file. 
                "outletTS": "SA Conn: nid_tx00008 (Outlet TS: LW Outlet #1)"//the outlet ts name in the b file. 
            },

            "inputs": [],
            
            "outputs": [],
            "stores": [
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ],
            "type": "link"
        },
        {
            "name": "unsteady-simulation",//this action computes an unsteady simulation.
            "description": "compute unsteady simulation",
            "attributes": {
                "geom": "01",//the geometry number. (by making the geometry number and the plan number the same we can reuse the plan file in the bash script and reduce our overall io)
                "modelPrefix": "lewisville",//the model prefix.
                "plan": "01"//the plan number
            },
            "inputs": [],
            "outputs": [],
            "stores": [
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ],
            "type": "run"
        },
        {
            "name": "ras-extract",//ras extract actions allow for the extraction of data from hdf while it is local to the container into more cloud performant data formats. for this tutorial we are using json to illustrate the outputs but in real world applications something other than json should probably be used for better storage performance. 
            "type": "extract",
            "description": "boundary condition peak flow and stage",//in this case we are extracting bc peak flow and stage.
            "attributes": {
                "plan": "{ATTR::plan}.tmp",
                "modelPrefix": "{ATTR::modelPrefix}",
                "outputformat":"json",//format.
                "grouppath": "/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Boundary Conditions",//the path to the result table.
                "colnames":["stage(ft)","flow(cfs)"],//the stage and flow column names to use
                "exclude": "Flow per Face|Stage per Face|Flow per Cell",//an exclusion rule.
                "postprocess":["max"],//the statistic to perform on the time series.
                "writesummary":true,//flush memory
                "datatype": "float32",
                "block-name": "bcline_peak",//the block within the storage type to keep summaries separate
                "accumulate-results": true//by accumuulating the same file will be used for the next set of extracted results.
            }
        },
        {
            "name": "ras-extract",//another example of extracting data for refline flow data.
            "type": "extract",
            "description": "refline-flow",
            "attributes": {
                "plan": "{ATTR::plan}.tmp",
                "modelPrefix": "{ATTR::modelPrefix}",
                "outputformat":"json",
                "datapath": "/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Reference Lines/Flow",//the data path.
                "coldata":"/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Reference Lines/Name",//the column options.
                "postprocess":["max"],//the statistic.
                "writesummary":true,
                "datatype": "float32",
                "block-name": "refline_peak_flow",//the block name.
                "accumulate-results": true//continue accumulation.
            }
        },
        {
            "name": "ras-extract",
            "type": "extract",
            "description": "refline-wsel",//extracting refline wsel max.
            "attributes": {
                "plan": "{ATTR::plan}.tmp",
                "modelPrefix": "{ATTR::modelPrefix}",
                "outputformat":"json",
                "datapath": "/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Reference Lines/Water Surface",
                "coldata":"/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Reference Lines/Name",
                "postprocess":["max"],
                "writesummary":true,
                "datatype": "float32",
                "block-name": "refline_peak_wsel",
                "accumulate-results": true
            }
        },
        {
            "name": "ras-extract",
            "type": "extract",
            "description": "refpoint-velocity",//extracting min and max refpoijnt velocity.
            "attributes": {
                "plan": "{ATTR::plan}.tmp",
                "modelPrefix": "{ATTR::modelPrefix}",
                "outputformat":"json",
                "datapath": "/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Reference Points/Velocity",
                "coldata":"/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Reference Points/Name",
                "postprocess":["max","min"],//two statistics here min and max.
                "writesummary":true,
                "datatype": "float32",
                "block-name": "refpoint_velocity",
                "accumulate-results": true
            }
        },
        {
            "name": "ras-extract",
            "type": "extract",
            "description": "refpoint-wsel",//extracting refpoint min and max wsel.
            "attributes": {
                "plan": "{ATTR::plan}.tmp",
                "modelPrefix": "{ATTR::modelPrefix}",
                "outputformat":"json",
                "datapath": "/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Reference Points/Water Surface",
                "coldata":"/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Reference Points/Name",
                "postprocess":["max","min"],//two statistics again.
                "writesummary":true,
                "datatype": "float32",
                "block-name": "refpoint_wsel",
                "accumulate-results": true
            }
        },
        {
            "name": "ras-extract",
            "type": "extract",
            "description": "structure variable peak",//pulling peak variables from structures.
            "attributes": {
                "plan": "{ATTR::plan}.tmp",
                "modelPrefix": "{ATTR::modelPrefix}",
                "outputformat": "json",
                "grouppath": "/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/2D Flow Areas/{ATTR::twoDSA}/2D Hyd Conn",
                "groupsuffix": "Structure Variables",
                "colnames": ["Total Flow", "Weir Flow", "Stage HW", "Stage TW", "Total Culv"],
                "postprocess":  ["max"],
                "writesummary":true,
                "datatype": "float32",
                "block-name": "structure_var_peak",
                "accumulate-results": true
            }
        },
        {
            "name": "ras-extract",
            "type": "extract",
            "description": "summary attributes",//pulling various summary attributes that are helpful. 
            "attributes": {
                "plan": "{ATTR::plan}.tmp",
                "modelPrefix": "{ATTR::modelPrefix}",
                "outputformat": "json",
                "datapath":  "/Results/Unsteady/Summary",
                "attributes": true,
                "colnames": ["Computation Time DSS", "Computation Time Total", "Maximum WSEL Error", "Maximum number of cores", "Run Time Window", "Solution", "Time Solution Went Unstable","Time Stamp Solution Went Unstable"],//the list of specific attributes to pull. 
                "block-name": "summary_attributes",
                "accumulate-results": true
            }
        },
        {
            "name": "ras-extract",
            "type": "extract",
            "description": "2dSA summary attributes",//pulling additional attributes from a separate table in ras specific to the 2d storage area.
            "attributes": {
                "plan": "{ATTR::plan}.tmp",
                "modelPrefix": "{ATTR::modelPrefix}",
                "outputformat": "json",
                "datapath":  "/Results/Unsteady/Output/Output Blocks/Base Output/Summary Output/2D Flow Areas/{ATTR::twoDSA}",
                "attributes": true,
                "colnames": ["Cum Net Precip Inches", "Vol Accounting Error", "Vol Accounting Error Percentage", "Vol Accounting External Inflow", "Vol Accounting External Outflow", "Vol Acct. Inflow from Net Precip"],//the specific attributes.
                "block-name": "2DSA_summary_attributes",
                "accumulate-results": true
            }
        },
        {
            "name": "ras-breach-extract",//a specialized extract unique to breach data
            "type": "extract",
            "description": "breach-extract",
            "attributes": {
                "plan": "{ATTR::plan}.tmp",
                "modelPrefix": "{ATTR::modelPrefix}",
                "outputDataSource": "event_summary"
            }//with no accumulate results set to true the json is written after this action.
        }
    ],
    "depends-on": [
        "ras-runner-compute-manifest-clear-creek.json",//a dependency on clear creek
        "ras-runner-compute-manifest-ray-roberts.json"//a dependency on ray roberts.
    ]
}
```