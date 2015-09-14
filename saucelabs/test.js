var   user       = process.env.SAUCE_USERNAME
    , key        = process.env.SAUCE_ACCESS_KEY
    , path       = require('path')
    , brtapsauce = require('brtapsauce')

      // list of browsers & versions that you want to test
    , capabilities = [
          { browserName: 'chrome'            , platform: 'Windows 8' , version: ''   }
        , { browserName: 'firefox'           , platform: 'Windows 8' , version: ''   }
        , { browserName: 'internet explorer' , platform: 'Windows 8' , version: '10' }
        , { browserName: 'internet explorer' , platform: 'Windows 7' , version: '11'  }
        , { browserName: 'safari'            , platform: 'OS X 10.0.8' , version: '7.1'  }
        , { browserName: 'ipad'              , platform: 'OS X 10.8' , version: '8'  }
        , { browserName: 'android'           , platform: 'Linux'     , version: '4.0', 'device-type': 'tablet' }
      ]

if (!user)
  throw new Error('Must set a SAUCE_USER env var')
if (!key)
  throw new Error('Must set a SAUCE_KEY env var')

brtapsauce({
    name         : 'FruitDOWN'
  , user         : user
  , key          : key
  , brsrc        : path.join(__dirname, 'browserified.js')
  , capabilities : capabilities
})
