// method taken from https://gist.github.com/960189
jQuery.Color.fn.contrastColor = function() {
    var r = this._rgba[0], g = this._rgba[1], b = this._rgba[2];
    return (((r*299)+(g*587)+(b*144))/1000) >= 131.5 ? "black" : "white";
};
jQuery.Color.fn.toXY = function() {
    var red = this._rgba[0]/255, green = this._rgba[1]/255, blue = this._rgba[2]/255;
    
    //Apply a gamma correction to the RGB values
    red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
    green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
    blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

    //Convert the RGB values to XYZ using the Wide RGB D65 conversion formula The formulas used:
    var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
    var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
    var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

    //Calculate the xy values from the XYZ values
    var x = X / (X + Y + Z);
    var y = Y / (X + Y + Z);
    return [x, y, Y];
};
jQuery.Color.fromXY = function(x, y, brightness) {
    x = x * 1.0; // the given x value
    y = y * 1.0; // the given y value
    var z = 1.0 - x - y;
    var Y =  brightness * 1.0; // The given brightness value
    var X = (Y / y) * x;
    var Z = (Y / y) * z;

    //Convert to RGB using Wide RGB D65 conversion
    var r =  X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    var g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    var b =  X * 0.051713 - Y * 0.121364 + Z * 1.011530;
    
    //Apply reverse gamma correction
    r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
    g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
    b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;

    return jQuery.Color( r*255, g*255, b * 255, 1.0 );
};
/** 
* @param {Number} degree - UIInterfaceOrientationPortrait: 0, UIInterfaceOrientationLandscapeRight: 90, UIInterfaceOrientationLandscapeLeft: -90, UIInterfaceOrientationPortraitUpsideDown: 180
* @returns {Boolean} Indicating if rotation should be allowed.
*/
function shouldRotateToOrientation(degrees) {
     return true;
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener("pause", this.onPause, false);
        document.addEventListener("resume", this.onResume, false);
    },
    onResume: function() {
        console.log("Resuming from background");
        window.plugins.insomnia.keepAwake(function onSuccess(){
                console.log("Turned into a Zoombie");
            }, function onError(e){
                console.warn("Couldn't turn into a Zoombie", e);
        });
    },
    onPause: function() {
        console.log("Moving to background");
        window.plugins.insomnia.allowSleepAgain(function onSuccess(){
                console.log("Turned back from being a Zoombie");
            }, function onError(e){
                console.warn("Couldn't turn back from being a Zoombie", e);
        });
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        console.log("Device ready");
        app.receivedEvent('deviceready');
        app.onResume();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ', id);
        
        if (id == 'deviceready') {
            $("#deviceready").removeClass("notconnected").addClass("connected");
        }
    }
};

app.initialize();

$(function () {
    var animation = 2000;
    var currentLight = 0;
    var hueBridge;
    var hue = jsHue();

    function updateLight(light, color) {
        light.animate({
            'background-color': color,
            'color': color.contrastColor() },
            animation);
        if (hueBridge)
            hueBridge.setLightState(
                light.data("id"), {
                    hue: Math.floor(color.hue()/360*65535), 
                    sat:Math.floor(color.saturation()*254), 
                    bri:Math.floor(color.lightness()*254/0.66)
            });
    }

    var showTimeout;
    var stopShow = function(e) {
        if (showTimeout) {
            clearTimeout(showTimeout);
        }
    }
    var startShow = function(e) {
        stopShow();

        var lights = $(".light");
        
        currentLight++;
        if (currentLight == lights.length) {
            currentLight = 0;
        }

        var light = $(lights[currentLight]);
        var hue = light.data("hue");

        var newHueOffset = Math.floor(Math.random() * 90 - 45);
        hue = hue + newHueOffset;
        if (hue > 360) {
            hue = hue - 360;
        }
        console.log("Updating "+light+" to new hue: ", hue);

        color = jQuery.Color({ hue: hue, saturation: 1.0, lightness: 0.66, alpha:1.0});

        updateLight(light, color);

        showTimeout = setTimeout(arguments.callee, animation);
    }
    $('#stopShowButton').click(stopShow);
    $('#startShowButton').click(startShow);

    function numToGridChar(num) {
        switch(num) {
            case 1:
                return "a";
            case 2:
                return "b";
            case 3:
                return "c";
            case 4:
                return "d";
            default:
                return "e";
        }
    }

    function ggt(lights) {
        found = 1;
        result = 1;

        while (lights > result) {
            if (lights % result == 0) {
                found = result;
            }
            result++;
        }

        return found > 5 ? 5 : found;
    }
  
  function modelToIcon(modelId) {
  switch(modelId) {
  case "LCT001":
  return "ui-icon-hue-a19";
  case "LST001":
  return "ui-icon-hue-lightstrip";
  default:
  return "entity_filled.svg";
  }
  }

    function buildLightGrid(lights) {
        $("#room div").remove();
        $("#room").removeClass("ui-grid-a", "ui-grid-b", "ui-grid-c", "ui-grid-d", "ui-grid-e");
        var lightNumber = 0;
        for (var light in lights) {
           if (lights.hasOwnProperty(light)) {
                lightNumber++;
            }
        }
        var rows = ggt(lightNumber);
        $("#room").addClass("ui-grid-" + numToGridChar(rows - 1));

        var i = 0;
        for (var light in lights) {
           if (lights.hasOwnProperty(light)) {
                lightContainer = $("<div />");
                lightContainer.addClass("ui-block-" + numToGridChar((i++ % rows) + 1));

                lightElement = $('<button type="button" data-theme="a"/>')
                    .addClass("light ui-btn ui-btn-icon-left");
                lightElement.addClass(modelToIcon(lights[light].modelid));
                lightElement.append(lights[light].name);
                
                lightElement.data("id", light);
                var state = lights[light].state;
                var lightcolor;
                if (state.colormode == "xy") {
                    lightcolor = jQuery.Color.fromXY(state.xy[0], state.xy[1], state.bri/255);
                } else if (state.colormode == "hs") {
                    lightcolor = jQuery.Color({ hue: state.hue, saturation: state.sat, lightness: 0.57y, alpha: 1.0 });
                } else if (state.colormode == "ct") {
                    console.warn("Colormode not supported: " + state.colormode);
                } else {
                    console.warn("Colormode unknown: " + state.colormode);
                }
                lightElement.data("hue", lightcolor.hue());

                lightContainer.append(lightElement);
                $("#room").append(lightContainer);

                lightElement.animate({
                    'background-color': lightcolor,
                    'color': lightcolor.contrastColor() },
                    400);
           }
        }
    }

    function initLights(bridge) {
        $.mobile.loading( "show", {
          text: "Initalizing Lights",
          textVisible: true
        });

        bridge.getLights(function(lights) {
            $("#reconnectBridgeButton").removeClass("notconnected").addClass("connected");
            $("#startShowButton").removeClass("ui-disabled");
            $("#stopShowButton").removeClass("ui-disabled");
            $.mobile.loading( "hide" );
            buildLightGrid(lights);
            hueBridge = bridge;
        }, function(err) {
            $.mobile.loading( "hide" );
            console.error(err);
        });
    }

    var settings = Cookies.getJSON('LoungHue');
    if (settings) {
        console.log("Restoring connection via ", settings);
        var hueBridge = hue.bridge(settings.ip).user(settings.username);

        initLights(hueBridge);
    }

    $("#searchBridgeDialog").on("popupafteropen", function( event, ui ) { 
        $("#searchBridgeButton").click();
    });

    $("#searchBridgeDialog").on("popupafterclose", function( event, ui ) { 
        $("#searchBridgeStatus").html("&nbsp;");
        $("#connectBridgeButton").addClass("ui-disabled");
        $("#searchBridgeResultTable tbody tr").remove();
        $("#searchBridgeStatus").remove();
    });

    $("#connectBridgeButton").click(function(e) {
        var bridgeIp = $('input[name=searchBridgeResultTableChoice]:checked').val();
        
        var hueBridge = hue.bridge(bridgeIp);
        console.log("Connecting to bridge " + bridgeIp);
        
        $.mobile.loading( "show", {
          text: "Connecting to bridge " + bridgeIp,
          textVisible: true
        });

        hueBridge.createUser("LoungHue", function(successResultArray){
            $.mobile.loading( "hide" );
            successResult = successResultArray[0];
            if (successResult.error) {
                var errorMessage = successResult.error.description;
                console.error(errorMessage, successResult);
                $("#searchBridgeStatus").empty();
                if (errorMessage == "link button not pressed") {
                    $("#searchBridgeStatus")
                         .append("Link Button not pressed. Press it and click 'Connect' again!")
                         .addClass("ui-icon-hue-push-button");
                } else {
                    $("#searchBridgeStatus").append(errorMessage).addClass("ui-icon-hue-bridge");
                }
                return;
            } else {
                var username = successResult.success.username;
                console.log("Connected as " + username, successResult);

                var settings = {username: username, ip: bridgeIp};
                Cookies.set('LoungHue',  settings, { expires: 365 });
                $("#reconnectBridgeButton").removeClass("ui-disabled");
                $("#searchBridgeDialog").popup("close");
                initLights(hueBridge.user(username));

            }
        }, function(err) {
             $("#searchBridgeStatus").html(err.message);
             console.error(err.message, err);

            $.mobile.loading( "hide" );
        });
    });

    $("#searchBridgeButton").click(function(e) {
        console.log("Start searching for bridge");
        
        $("#connectBridgeButton").addClass("ui-disabled");
        $("#searchBridgeResultTable tbody tr").remove();
        $("#searchBridgeStatus").empty();
        $.mobile.loading( "show", {
          text: "Searching Bridges",
          textVisible: true
        });
        
        hue.discover(function(bridges) {
            $.mobile.loading( "hide" );
            if(bridges.length === 0) {
                $.mobile.loading( "hide" );
                msg = $("<div>No bridges found. :").addClass("ui-icon-hue-bridge");
                $("#searchBridgeStatus").append(msg);
            } else {
                bridges.forEach(function(b) {
                    console.log('Bridge found: ', b);
                    $("#searchBridgeResultTable tbody").append('<tr><td><input type="radio" name="searchBridgeResultTableChoice" id="'+b.id+'" value="'+b.internalipaddress+'" checked="checked"></td><td>'+b.internalipaddress+"</td></tr>"); 
                });
                $("#connectBridgeButton").removeClass("ui-disabled");
            }
        },
        function(error) {
            $.mobile.loading( "hide" );
            $("#searchBridgeStatus").html(error.message);
        }
    );

    });
});
