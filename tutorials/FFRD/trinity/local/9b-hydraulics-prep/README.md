## Hydraulics Prep
The purpose of this compute manifest is to take HEC-HMS and HEC-ResSim outputs and push them into the appropriate RAS HDF files.
This is some of the most complicated linkages in the tutorial workflow.

Each HEC-RAS domain represents a unique geographic area which may have no dams or many dams, it may be a headwater or a model that is intermediate to the basin, it may have a dam that is regulated by HEC-ResSim, HEC-HMS or through a rating curve. Each of these differences mean that each Model Unit within the watershed may have very different sets of actions to set data for an event.

## Relevant Actions documentation
https://github.com/USACE-Cloud-Compute/hms-runner/blob/main/src/main/java/usace/cc/plugin/hmsrunner/actions/DssToHDFAction.md
https://github.com/USACE-Cloud-Compute/hms-runner/blob/main/src/main/java/usace/cc/plugin/hmsrunner/actions/DssToHdfPoolElevationAction.md
https://github.com/USACE-Cloud-Compute/hms-runner/blob/main/src/main/java/usace/cc/plugin/hmsrunner/actions/DssToHdfActionTSOut.md
https://github.com/USACE-Cloud-Compute/hms-runner/blob/main/src/main/java/usace/cc/plugin/hmsrunner/actions/CopyPrecipAction.md


## parametrization for the tutorial
# dss_to_hdf
This action takes DSS data from HEC-HMS and moves it to HEC-RAS in HDF for base flow inputs via BCLines. The name of the BCLine is used to match the origin dss datapath to the destination bcline path.
| Attribute | Description | Value |
|-----------|----------|-------------|
| not applicable | |
# action level input data sources
| Input Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| source | default | /model/trinity/SST.dss |  brushy-elm-ck_s010 | //brushy-elm-ck_s010/FLOW-BASE//1Hour/RUN:SST/ |

# action level output data sources
| Output Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| destination | default | /model/ray-roberts/ray-roberts.p01.hdf |  brushy-elm-ck_s010 | Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_brushy-elm-ck_s010_base |

# dss_to_hdf_pool_elevations
This action takes DSS data from HEC-HMS (or HEC-Ressim) and sets cell level initial pool conditions associated with an IC Point in HEC-RAS based on the first timestep of the source time series. Each dam should have its own IC Point in HEC-RAS, and each IC Point should be associated with a list of cells that are goverened by that IC Point. The IC point name is used as a data path key in the source and the destination as well as a destination data path key of "CellsCSV" and "TwoDFlowAreaName". The CellsCSV must be all cells that are updated for the same elevation for a given dam.
| Attribute | Description | Value |
|-----------|----------|-------------|
| not applicable | |
# action level input data sources
| Input Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| source | default | /model/trinity/simulation.dss |  "IC_ray-roberts-dam" | "//Ray Roberts-Pool/Elev//1Hour/fema_ffrd-0/" |

# action level output data sources
| Output Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| destination | default | /model/ray-roberts/ray-roberts.p01.hdf |  "CellsCSV" | "3404,3429,3502,3529,3631,3632,3728,..." |
| destination | default | /model/ray-roberts/ray-roberts.p01.hdf |  "IC_ray-roberts-dam" | "IC_ray-roberts-dam" |
| destination | default | /model/ray-roberts/ray-roberts.p01.hdf |  "TwoDFlowAreaName" | ray-roberts |

# dss_to_hdf_tsout
This action takes DSS data from HEC-ResSim and the outflow as timeseries from a 2d structure representing a dam. This action assumes input data from HEC-ResSim is period cumulative and that the destination in HDF is expecting period average so a half timestep conversion is made. The datapath key represents the dam name and is used to match the origin datapath to the destination datapath 

| Attribute | Description | Value |
|-----------|----------|-------------|
| not applicable | |
# action level input data sources
| Input Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| source | default | /model/trinity/simulation.dss |  "nid_tx08008" | "//Ray Roberts Outflow/Flow//1Hour/fema_ffrd-0/" |

# action level output data sources
| Output Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| destination | default | /model/ray-roberts/ray-roberts.p01.hdf |  "nid_tx08008" | "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/SA Conn: nid_tx08008 (Outlet TS: USGS08051135)" |

# copy_precip_table
This action takes an exported precipitation HDF table (exported by Vortex via HEC-HMS) and copies the exported excess precip from one hdf file into the destination. The source table can be copied to many destination hdf files represented by each path key in the destination

| Attribute | Description | Value |
|-----------|----------|-------------|
| not applicable | |
# action level input data sources
| Input Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| source | default | /model/trinity/exported-precip_trinity.p01.tmp.hdf |  "default" | "Event Conditions/Meteorology/Precipitation/Values" |

# action level output data sources
| Output Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| destination | clear-creek | /model/clear-creek/clear-creek.p01.hdf |  "default" | "Event Conditions/Meterology/Precipitation/values" |
| destination | lewisville | /model/lewisville/lewisville.p01.hdf |  "default" | "Event Conditions/Meterology/Precipitation/values" |
| destination | ray-roberts | /model/ray-roberts/ray-roberts.p01.hdf |  "default" | "Event Conditions/Meterology/Precipitation/values" |


## required inputs

| Datasource Name | Path Key | Path Value (resolved from substitution) |
|-----------|----------|-------------|
| clear-creek.p01.hdf | default | /conformance/hydraulics/clear-creek/clear-creek.p01.hdf |
| ray-roberts.p01.hdf | default | /conformance/hydraulics/ray-roberts/ray-roberts.p01.hdf |
| lewisville.p01.hdf | default | /conformance/hydraulics/lewisville/lewisville.p01.hdf |
| exported-precip_trinty.p01.tmp.hdf | default | /conformance/simulations/{ENV::CC_EVENT_IDENTIFIER}/hydrology/exported-precip_trinity.p01.tmp.hdf |
| SST.dss | default | /conformance/simulations/{ENV::CC_EVENT_IDENTIFIER}/hydrology/SST.dss |
| simulation.dss | default | /conformance/simulations/{ENV::CC_EVENT_IDENTIFIER}/reservoir-operations/simulation.dss |


Documentation of the manifest is at the bottom of the readme this time because of the manifest size and complexity.
```json
{
    "manifest_name": "prep_tmp_hdf",//a user provided name
    "plugin_definition": "FFRD-HMS-RUNNER-TRINITY",//the plugin name registered in the plugin manifest.
    "stores": [//global stores.
        {
            "name": "FFRD",//the name of the store (used by datasource to get and put data)
            "store_type": "S3",//store type of S3 Simple Storage System. for the tutorial minio is being used to mock S3.
            "profile": "FFRD",//a profile is used to associate the store with the appropriate secrets.
            "params": {
                "root": "model-library/ffrd-trinity"//a root is used to isolate a store to a set of prefixes.
            }
        }
    ],
    "inputs": {//global inputs for datasources and attributes.
        "payload_attributes": {//global attributes.
            "base-hydraulics-directory": "hydraulics",//an attribute describing the name of the "directory" where hydraulics data lives.
            "base-hydrology-directory": "hydrology",//an attribute describing the name of the "directory" where hydrology data lives.
            "base-reservoir-operations-directory": "reservoir-operations",//an attribute describing the name of the "directory" where reservoir operations data lives.
            "base-system-response-directory": "system-response",//an attribute describing the name of the "directory" where system-response data lives.
            "hydrology-simulation": "SST",//an attribute describing the hydrology simulation name.
            "model-name": "trinity",//an attribute describing the hydrology basin model name.
            "outputdir": "simulations",// an attribute describing the output directory
            "outputroot": "simulations/event-data",//an attribute describing the event level output directory.
            "plan": "01",//a plan number for plans (01 is used exclusively for all ras models.)
            "scenario": "conformance",//an attribute for the scenario, conformance and production are the typical scenarios for ffrd watersheds.
            "watershed": "ffrd_trinity"//an attibute for the watershed in ressim.
        },
        "data_sources": [//global input data sources, these will be automatically copied into the container at the start of the compute.
            {
                "name": "exported-precip_{ATTR::model-name}.p{ATTR::plan}.tmp.hdf",//the exported precip in an hdf file format from the HEC-HMS run (exported by vortex within hms.)
                "paths": {
                    "default": "{ATTR::scenario}/{ATTR::outputroot}/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydrology-directory}/exported-precip_{ATTR::model-name}.p{ATTR::plan}.tmp.hdf"//the path to where the exported precip lives, notice it lives in an EVENT SPECIFIC folder, so this same manifest will be used for all EVENTS to prepare data for RAS.
                },
                "data_paths": {
                    "default": "Event Conditions/Meteorology/Precipitation/Values"//the internal datapath to where precipitation data lives.
                },
                "store_name": "FFRD"//the store name for where the exported precip tmp hdf lives.
            },
            {
                "name": "lewisville.p01.hdf",//the lewisville hdf file (with results already removed.)
                "paths": {
                    "default": "{ATTR::scenario}/{ATTR::base-hydraulics-directory}/lewisville/lewisville.p01.hdf"//the path to where the base hdf lives that will be updated for each event.
                },
                "store_name": "FFRD"//the store name.
            },
            {
                "name": "clear-creek.p01.hdf",//the clear creek hdf file (with results already removed.)
                "paths": {
                    "default": "{ATTR::scenario}/{ATTR::base-hydraulics-directory}/clear-creek/clear-creek.p01.hdf"//the path to where the base hdf lives that will be updated for each event.
                },
                "store_name": "FFRD"//the store name.
            },
            {
                "name": "ray-roberts.p01.hdf",//the ray roberts hdf file (with results already removed.)
                "paths": {
                    "default": "{ATTR::scenario}/{ATTR::base-hydraulics-directory}/ray-roberts/ray-roberts.p01.hdf"//the path to where the base hdf lives that will be updated for each event.
                },
                "store_name": "FFRD"//the store name.
            },
            {
                "name": "simulation.dss",//the simulation dss file (output from HEC-ResSim)
                "paths": {
                    "default": "{ATTR::scenario}/{ATTR::outputroot}/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-reservoir-operations-directory}/simulation.dss"//the path for the specific event where the output lives.
                },
                "store_name": "FFRD"//the store name.
            },
            {
                "name": "{ATTR::hydrology-simulation}.dss",//the HMS output dss file.
                "paths": {
                    "default": "{ATTR::scenario}/{ATTR::outputroot}/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydrology-directory}/{ATTR::hydrology-simulation}.dss"//the path for the specific event where the output from hms lives.
                },
                "store_name": "FFRD"//the store name.
            }
        ]
    },
    "outputs": [//global outputs, will be auto uploaded at the end of the running of all actions.
        {
            "name": "clear-creek.p01.hdf",//an updated clear creek hdf file.
            "paths": {
                "default": "{ATTR::scenario}/{ATTR::outputroot}/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydraulics-directory}/clear-creek/clear-creek.p01.tmp.hdf"//the EVENT SPECIFIC path where the updated hdf file should be put. Notice the destination path includes the ".tmp" in the name which is required for RAS when running a plan in linux.
            },
            "store_name": "FFRD"//the store name.
        },
        {
            "name": "ray-roberts.p01.hdf",//an updated ray roberts hdf file.
            "paths": {
                "default": "{ATTR::scenario}/{ATTR::outputroot}/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydraulics-directory}/ray-roberts/ray-roberts.p01.tmp.hdf"//the EVENT SPECIFIC path where the updated hdf file should be put. Notice the destination path includes the ".tmp" in the name which is required for RAS when running a plan in linux.
            },
            "store_name": "FFRD"//the store name
        },
        {
            "name": "lewisville.p01.hdf",//an updated lewisville hdf file.
            "paths": {
                "default": "{ATTR::scenario}/{ATTR::outputroot}/{ENV::CC_EVENT_IDENTIFIER}/{ATTR::base-hydraulics-directory}/lewisville/lewisville.p01.tmp.hdf"//the EVENT SPECIFIC path where the updated hdf file should be put. Notice the destination path includes the ".tmp" in the name which is required for RAS when running a plan in linux.
            },
            "store_name": "FFRD"//the store name.
        }
    ],
    "actions": [//the actions. there are many actions, each will happen in the order of this array.
        {
            "type": "dss_to_hdf_tsout",//the name of the action 'dss_to_hdf_tsout' takes regulated dss output from ressim and sets the ras time series outflows.
            "description": "updating regulated outflows from ressim output",//a description of the action.
            "attributes": {//action level attributes (local to the action)
                "base-hydraulics-directory": "hydraulics",//the base hydraulics directory
                "base-hydrology-directory": "hydrology",//the base hydrology directory
                "base-reservoir-operations-directory": "reservoir-operations",//the base reservoir operations directory
                "base-system-response-directory": "system-response",//the base system-response directory
                "hydrology-simulation": "SST",//the hydrology simulation name
                "model-name": "trinity",//the hydrology basin model name.
                "modelPrefix": "ray-roberts",//the specific model prefix name for this action
                "outputdir": "simulations",//the output directory
                "outputroot": "simulations/event-data",//the event-data specific output directory
                "plan": "01",//the plan number.
                "scenario": "conformance",//the scenario.
                "watershed": "ffrd_trinity"//the ressim watershed name.
            },
            "inputs": [//action level local inputs.
                {
                    "name": "source",//the source dss file.
                    "paths": {
                        "default": "/model/{ATTR::model-name}/simulation.dss"//the ressim local simulation file location.
                    },
                    "data_paths": {
                        "nid_tx08008": "//Ray Roberts Outflow/Flow//1Hour/fema_ffrd-0/"//the data path for the specific dss path needed in this case.
                    },
                    "store_name": "FFRD"//the store name.
                }
            ],
            "outputs": [//action level ouptuts.
                {
                    "name": "destination",//the destination file.
                    "paths": {
                        "default": "/model/{ATTR::model-name}/ray-roberts.p{ATTR::plan}.hdf"//the path to the local ray roberts hdf file.
                    },
                    "data_paths": {
                        "nid_tx08008": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/SA Conn: nid_tx08008 (Outlet TS: USGS08051135)"//the path to the corresponding location where the dss data will be written.
                    },
                    "store_name": "FFRD"//the store name.
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
            ]
        },
        {
            "type": "dss_to_hdf",//the action name 'dss_to_hdf' takes dss time series data and puts it in hdf.
            "description": "updating baseflows from hms output",//a description.
            "attributes": {//action level attributes (local to the action)
                "base-hydraulics-directory": "hydraulics",//the base hydraulics directory
                "base-hydrology-directory": "hydrology",//the base hydrology directory
                "base-reservoir-operations-directory": "reservoir-operations",//the base reservoir operations directory
                "base-system-response-directory": "system-response",//the base system-response directory
                "hydrology-simulation": "SST",//the hydrology simulation name
                "model-name": "trinity",//the hydrology basin model name.
                "modelPrefix": "ray-roberts",//the specific model prefix name for this action
                "outputdir": "simulations",//the output directory
                "outputroot": "simulations/event-data",//the event-data specific output directory
                "plan": "01",//the plan number.
                "scenario": "conformance",//the scenario.
                "watershed": "ffrd_trinity"//the ressim watershed name.
            },
            "inputs": [//the action level input data.
                {
                    "name": "source",//the source dss file.
                    "paths": {
                        "default": "/model/{ATTR::model-name}/{ATTR::hydrology-simulation}.dss"//the path to the hms simulation dss file.
                    },
                    "data_paths": {//datapaths the keys will match with the destination keys, the datapathnames will describe the hms output. Per the SOP these names should be consistent in terms of how things relate to the hdf files.
                        "brushy-elm-ck_s010": "//brushy-elm-ck_s010/FLOW-BASE//1Hour/RUN:SST/",
                        "brushy-elm-ck_s020": "//brushy-elm-ck_s020/FLOW-BASE//1Hour/RUN:SST/",
                        "buck-ck_s010": "//buck-ck_s010/FLOW-BASE//1Hour/RUN:SST/",
                        "elm-fork_s100": "//elm-fork_s100/FLOW-BASE//1Hour/RUN:SST/",
                        "elm-fork_s110": "//elm-fork_s110/FLOW-BASE//1Hour/RUN:SST/",
                        "elm-fork_s120": "//elm-fork_s120/FLOW-BASE//1Hour/RUN:SST/",
                        "elm-fork_s130": "//elm-fork_s130/FLOW-BASE//1Hour/RUN:SST/",
                        "elm-fork_s140": "//elm-fork_s140/FLOW-BASE//1Hour/RUN:SST/",
                        "elm-fork_s150": "//elm-fork_s150/FLOW-BASE//1Hour/RUN:SST/",
                        "elm-fork_s160": "//elm-fork_s160/FLOW-BASE//1Hour/RUN:SST/",
                        "lake-kiowa_s010": "//lake-kiowa_s010/FLOW-BASE//1Hour/RUN:SST/",
                        "lake-kiowa_s020": "//lake-kiowa_s020/FLOW-BASE//1Hour/RUN:SST/",
                        "range-ck_s010": "//range-ck_s010/FLOW-BASE//1Hour/RUN:SST/",
                        "range-ck_s020": "//range-ck_s020/FLOW-BASE//1Hour/RUN:SST/",
                        "range-ck_s030": "//range-ck_s030/FLOW-BASE//1Hour/RUN:SST/",
                        "ray-roberts_s010": "//ray-roberts_s010/FLOW-BASE//1Hour/RUN:SST/",
                        "ray-roberts_s020": "//ray-roberts_s020/FLOW-BASE//1Hour/RUN:SST/",
                        "ray-roberts_s030": "//ray-roberts_s030/FLOW-BASE//1Hour/RUN:SST/",
                        "ray-roberts_s040": "//ray-roberts_s040/FLOW-BASE//1Hour/RUN:SST/",
                        "ray-roberts_s050": "//ray-roberts_s050/FLOW-BASE//1Hour/RUN:SST/",
                        "ray-roberts_s060": "//ray-roberts_s060/FLOW-BASE//1Hour/RUN:SST/",
                        "spring-ck_s010": "//spring-ck_s010/FLOW-BASE//1Hour/RUN:SST/",
                        "spring-ck_s020": "//spring-ck_s020/FLOW-BASE//1Hour/RUN:SST/",
                        "timber-ck_s010": "//timber-ck_s010/FLOW-BASE//1Hour/RUN:SST/",
                        "timber-ck_s020": "//timber-ck_s020/FLOW-BASE//1Hour/RUN:SST/",
                        "timber-ck_s030": "//timber-ck_s030/FLOW-BASE//1Hour/RUN:SST/",
                        "timber-ck_s040": "//timber-ck_s040/FLOW-BASE//1Hour/RUN:SST/"
                    },
                    "store_name": "FFRD"//the store name.
                }
            ],
            "outputs": [//the action level output destination.
                {
                    "name": "destination",//the destination hdf file.
                    "paths": {
                        "default": "/model/{ATTR::model-name}/ray-roberts.p{ATTR::plan}.hdf"//the path to the ray roberts hdf file.
                    },
                    "data_paths": {//the destination data paths, these should have keys consistent with the input sources, and the naming convention for the SOP would dictate that each baseflow location should be a bc line in ras with bc prepending, and _base as a postfix.
                        "brushy-elm-ck_s010": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_brushy-elm-ck_s010_base",
                        "brushy-elm-ck_s020": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_brushy-elm-ck_s020_base",
                        "buck-ck_s010": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_buck-ck_s010_base",
                        "elm-fork_s100": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_elm-fork_s100_base",
                        "elm-fork_s110": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_elm-fork_s110_base",
                        "elm-fork_s120": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_elm-fork_s120_base",
                        "elm-fork_s130": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_elm-fork_s130_base",
                        "elm-fork_s140": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_elm-fork_s140_base",
                        "elm-fork_s150": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_elm-fork_s150_base",
                        "elm-fork_s160": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_elm-fork_s160_base",
                        "lake-kiowa_s010": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_lake-kiowa_s010_base",
                        "lake-kiowa_s020": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_lake-kiowa_s020_base",
                        "range-ck_s010": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_range-ck_s010_base",
                        "range-ck_s020": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_range-ck_s020_base",
                        "range-ck_s030": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_range-ck_s030_base",
                        "ray-roberts_s010": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_ray-roberts_s010_base",
                        "ray-roberts_s020": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_ray-roberts_s020_base",
                        "ray-roberts_s030": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_ray-roberts_s030_base",
                        "ray-roberts_s040": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_ray-roberts_s040_base",
                        "ray-roberts_s050": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_ray-roberts_s050_base",
                        "ray-roberts_s060": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_ray-roberts_s060_base",
                        "spring-ck_s010": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_spring-ck_s010_base",
                        "spring-ck_s020": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_spring-ck_s020_base",
                        "timber-ck_s010": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_timber-ck_s010_base",
                        "timber-ck_s020": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_timber-ck_s020_base",
                        "timber-ck_s030": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_timber-ck_s030_base",
                        "timber-ck_s040": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: ray-roberts BCLine: bc_timber-ck_s040_base"
                    },
                    "store_name": "FFRD"//the store name.
                }
            ],
            "stores": [//a local action level copy of the stores.
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ]
        },
        {
            "type": "dss_to_hdf_pool_elevations",//this action supports setting the initial condition pool elevation in a pool in ras to that which was defined by HMS or ResSim.
            "description": "updating pool elevations at icpoints",
            "attributes": {
                "base-hydraulics-directory": "hydraulics",
                "base-hydrology-directory": "hydrology",
                "base-reservoir-operations-directory": "reservoir-operations",
                "base-system-response-directory": "system-response",
                "hydrology-simulation": "SST",
                "model-name": "trinity",
                "modelPrefix": "ray-roberts",
                "outputdir": "simulations",
                "outputroot": "simulations/event-data",
                "plan": "01",
                "scenario": "conformance",
                "watershed": "ffrd_trinity"
            },
            "inputs": [
                {
                    "name": "source",//the source is the source dss file (in this case ressim dss file.) for ray roberts in the real compute manifest, there are 3 dams updated, this shows the action one time to describe the parameterization see the prep-tmp-compute-manifest.json for additional examples.
                    "paths": {
                        "default": "/model/{ATTR::model-name}/simulation.dss"
                    },
                    "data_paths": {//the key to the data path is the IC point name, the value is the dss pathname to the elevation of the pool.
                        "IC_ray-roberts-dam": "//Ray Roberts-Pool/Elev//1Hour/fema_ffrd-0/"
                    },
                    "store_name": "FFRD"
                }
            ],
            "outputs": [
                {
                    "name": "destination",
                    "paths": {//the destination is the model specific hdf file, 
                        "default": "/model/{ATTR::model-name}/ray-roberts.p{ATTR::plan}.hdf"
                    },
                    "data_paths": {//CellsCSV is a comma separated list of ras cell id's to set the target elevation for. The IC point name is provided, and the TwoDFlowAreaName the cells reside within is provided.
                        "CellsCSV": "3404,3429,3502,
                        ...
                        ,27727,27728,27729,27730,27731,27732,28109,28118,28123,28124,28125,28130",
                        "IC_ray-roberts-dam": "IC_ray-roberts-dam",
                        "TwoDFlowAreaName": "ray-roberts"
                    },
                    "store_name": "FFRD"
                }
            ],
            "stores": [//an action level copy of the store.
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ]
        },
        {
            "type": "dss_to_hdf_tsout",//this action updates the outflow for lewisville model unit for Lewisville dam (nid_tx00008)
            "description": "updating regulated outflows from ressim output",
            "attributes": {
                "base-hydraulics-directory": "hydraulics",
                "base-hydrology-directory": "hydrology",
                "base-reservoir-operations-directory": "reservoir-operations",
                "base-system-response-directory": "system-response",
                "hydrology-simulation": "SST",
                "model-name": "trinity",
                "modelPrefix": "lewisville",
                "outputdir": "simulations",
                "outputroot": "simulations/event-data",
                "plan": "01",
                "scenario": "conformance",
                "watershed": "ffrd_trinity"
            },
            "inputs": [
                {
                    "name": "source",//the source is the ressim output dss file
                    "paths": {
                        "default": "/model/{ATTR::model-name}/simulation.dss"//path to the local dss file from ressim (copied in from the global inputs.)
                    },
                    "data_paths": {
                        "nid_tx00008": "//Lewisville Outflow/Flow//1Hour/fema_ffrd-0/"//the dsspathname for the specific dam being updated.
                    },
                    "store_name": "FFRD"//store name.
                }
            ],
            "outputs": [
                {
                    "name": "destination",//the destination hdf file.
                    "paths": {
                        "default": "/model/{ATTR::model-name}/lewisville.p{ATTR::plan}.hdf"
                    },
                    "data_paths": {//the specific datapath within the hdf file to update.
                        "nid_tx00008": "Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/SA Conn: nid_tx00008 (Outlet TS: LW Outlet #1)"
                    },
                    "store_name": "FFRD"//store name.
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
            ]
        },//in the prep-tmp-compute-manifest there are many more actions listed, but they are repeats of already documented actions for other model areas or specific features.
        {
            "type": "copy_precip_table",//this action will copy a table from one hdf file into another.
            "description": "copy_precip_table",
            "attributes": {
                "base-hydraulics-directory": "hydraulics",
                "base-hydrology-directory": "hydrology",
                "base-reservoir-operations-directory": "reservoir-operations",
                "base-system-response-directory": "system-response",
                "hydrology-simulation": "SST",
                "model-name": "trinity",
                "outputdir": "simulations",
                "outputroot": "simulations/event-data",
                "plan": "01",
                "scenario": "conformance",
                "watershed": "ffrd_trinity"
            },
            "inputs": [
                {
                    "name": "source",//the source hdf file
                    "paths": {
                        "default": "/model/{ATTR::model-name}/exported-precip_{ATTR::model-name}.p{ATTR::plan}.tmp.hdf"//the path to the source hdf file (the exported precip from hms copied locally because it is in the global input datasources)
                    },
                    "data_paths": {
                        "default": "Event Conditions/Meteorology/Precipitation/Values"//the internal data path to the table that is to be copied.
                    },
                    "store_name": "FFRD"
                }
            ],
            "outputs": [
                {
                    "name": "destination",//the destination hdf files. each path will get the table from the input copied into it.
                    "paths": {
                        "clear-creek": "/model/{ATTR::model-name}/clear-creek.p01.hdf",//clear creek hdf
                        "lewisville": "/model/{ATTR::model-name}/lewisville.p01.hdf",//lewisville hdf
                        "ray-roberts": "/model/{ATTR::model-name}/ray-roberts.p01.hdf"//ray roberts hdf
                    },
                    "data_paths": {
                        "default": "Event Conditions/Meteorology/Precipitation/Values"//the datapath recieving the incoming table (table sizes must match.)
                    },
                    "store_name": "FFRD"
                }
            ],
            "stores": [//an action copy of the stores.
                {
                    "name": "FFRD",
                    "store_type": "S3",
                    "profile": "FFRD",
                    "params": {
                        "root": "model-library/ffrd-trinity"
                    }
                }
            ]
        }
    ]
}
```