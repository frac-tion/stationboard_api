# stationboard_api
API for stainboard webapp.

#### mobilitaetsagentur.bz.it API
Request for finding a busstops id and list of busstops (name_sf is search string)
more results with SpEncId=1 instate of SpEncId=0
http://efa.mobilitaetsagentur.bz.it/apb/XSLT_STOPFINDER_REQUEST?language=de&outputFormat=JSON&itdLPxx_usage=origin&useLocalityMainStop=true&doNotSearchForStops_sf=1&SpEncId=0&odvSugMacro=true&name_sf=L

Request for statianboard (name_dm is the busstop id)
for time and date add itdDateDayMonthYear=10.08.2015&itdTime=1125
http://efa.mobilitaetsagentur.bz.it/apb/XSLT_DM_REQUEST?language=de&deleteAssignedStops_dm=1&trITMOTvalue100=7&useProxFootSearch=0&itdLPxx_today=10&mode=direct&lsShowTrainsExplicit=0&type_dm=any&name_dm=66002294&includedMeans=checkbox&inclMOT_ZUG=1&inclMOT_BUS=1&inclMOT_8=1&inclMOT_9=1&locationServerActive=1&convertStopsPTKernel2LocationServer=1&convertAddressesITKernel2LocationServer=1&convertCoord2LocationServer=1&convertCrossingsITKernel2LocationServer=1&convertPOIsITKernel2LocationServer=1&stateless=1&itOptionsActive=1&ptOptionsActive=1&itdLPxx_depOnly=1&maxAssignedStops=1&hideBannerInfo=1&execInst=normal&limit=15&useAllStops=1&outputFormat=JSON

#### Our API
Request for finding a busstops id and list of busstops
https://domain.com/api/busstops?search=SearchQuery

Request for statianboard
https://domain.com/api/stationboard?search=SearchQuery
