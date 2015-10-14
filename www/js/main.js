// method taken from https://gist.github.com/960189
jQuery.Color.fn.contrastColor = function() {
    var r = this._rgba[0], g = this._rgba[1], b = this._rgba[2];
    return (((r*299)+(g*587)+(b*144))/1000) >= 131.5 ? "black" : "white";
};

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
        window.plugins.insomnia.keepAwake();
    },
    onPause: function() {
        window.plugins.insomnia.allowSleepAgain();
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        app.onResume();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ', id);

        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
    }
};

app.initialize();


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
        hueBridge.setLightState(light.data("id"), {hue: Math.floor(color.hue()/360*65535), sat:Math.floor(color.saturation()*254), bri:Math.floor(color.lightness()*254/0.66)});
}


var showTimeout;
$('#stopShow').click(function(e){
    clearTimeout(showTimeout);
});
$('#startShow').click(function(e){
    if (showTimeout) {
        clearTimeout(showTimeout);
    }

    var lights = $(".light");
    
    currentLight++;
    if (currentLight == lights.length) {
        currentLight = 0;
    }

    var light = $(lights[currentLight]);
    var hue = light.data("hue");
    console.log("Old hue: ", hue);

    var hue = Math.floor(hue + Math.random()*90-45);
    console.log("New hue: ", hue);
    if (hue > 360) {
        hue = hue - 360;
    }
    color = jQuery.Color({ hue: hue, saturation: 1.0, lightness: 0.66, alpha:1.0});

    updateLight(light, color);

    showTimeout = setTimeout(arguments.callee, animation);

});

function initLights(bridge) {
    $.mobile.loading( "show", {
      text: "Initalizing Lights",
      textVisible: true
    });

    bridge.getLights(function(lights) {
        var getRows = function(lights) {
            found = 1;
            result = 1;

            while (lights > result) {
                if (lights % result == 0) {
                    found = result;
                }
                result++;
            }

            return found;
        };

        var lightNumber = 0;
        for (var light in lights) {
           if (lights.hasOwnProperty(light)) {
                lightNumber++;
                lightElement = $('<div/>').addClass("light");
            
                lightElement.data("id", light);
                lightElement.append(lights[light].name);
                var hue = Math.floor(Math.random()*360);
                lightElement.data("hue", hue);

                color = jQuery.Color({ hue: hue, saturation: 1.0, lightness: 0.66, alpha:1.0});

                updateLight(lightElement, color);
                
                $("#room").append(lightElement);
           }
        }
     
        var rows = getRows(lightNumber);
        var columns = lightNumber / rows;
        $('.light').css({'width': Math.floor(90/columns) + "%", 'height': Math.floor(90/rows) + "%"});

        hueBridge = bridge;
    }, function(err) {
        console.error(err);
    });
}

var settings = Cookies.getJSON('LoungHue');
if (settings) {
    console.log("Restored connection via ", settings);
    $("#reconnectBridgeButton").removeClass("ui-disabled").addClass("ui-btn-active");
    var hueBridge = hue.bridge(settings.ip).user(settings.username);

    initLights(hueBridge);
}
//TODO move to jquery initalizier

$("#searchBridgeDialog").on("popupafteropen", function( event, ui ) { 
    $("#searchBridgeButton").click();
});

$("#searchBridgeDialog").on("popupafterclose", function( event, ui ) { 
    $("#searchBridgeStatus").html("&nbsp;");
    $("#connectBridgeButton").addClass("ui-disabled");
    $("#searchBridgeResultTable tbody tr").remove();
});

$("#connectBridgeButton").click(function(e) {
    var bridgeIp = $('input[name=searchBridgeResultTableChoice]:checked').val();
    
    var hueBridge = hue.bridge(bridgeIp).user();
    console.log("Connecting to bridge " + bridgeIp);
    
    $.mobile.loading( "show", {
      text: "Connecting to bridge " + bridgeIp,
      textVisible: true
    });

    hueBridge.create("LoungHue", function(successResultArray){
        $.mobile.loading( "hide" );
        successResult = successResultArray[0];
        if (successResult.error) {
            var errorMessage = successResult.error.description;
            console.error(errorMessage, successResult);
            if (errorMessage == "link button not pressed") {
                errorMessage = "Link Button not pressed. Press it and click 'Connect' again!"
            }
            $("#searchBridgeStatus").html(errorMessage);
            return;
        } else {
            var username = successResult.success.username;
            console.log("Connected as " + username, successResult);

            var settings = {username: username, ip: bridgeIp};
            Cookies.set('LoungHue',  settings, { expires: 365 });
            $("#reconnectBridgeButton").removeClass("ui-disabled");
            $("#searchBridgeDialog").popup("close");
            initLights(hueBridge);

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
    $("#searchBridgeStatus").html("&nbsp;");
    $.mobile.loading( "show", {
      text: "Searching Bridges",
      textVisible: true
    });
    
    hue.discover(function(bridges) {
        $.mobile.loading( "hide" );
        if(bridges.length === 0) {
            $.mobile.loading( "hide" );
            $("#searchBridgeStatus").html("No bridges found. :(");
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


