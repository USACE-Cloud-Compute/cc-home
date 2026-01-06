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

