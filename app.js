(function() {
'use strict';

  // System Code
  var http = require('http');

  var drone = require('ar-drone');
  var Parser = require('./node_modules/ar-drone/lib/video/PaVEParser.js');
  var parser = new Parser();

  var client = drone.createClient();
  // var tcpVideoStream = client.getVideoStream();
  // var output = require('fs').createWriteStream('./vid.mp4');
  // client.config('video:video_channel', 0);

console.log(client);

  // tcpVideoStream.on('data', console.log);

  // var server = http.createServer(function(req, res) {});
  // require("dronestream").listen(server);
  // server.listen(5555);

  /* requestAnimationFrame polyfill: */
(function (window) {
    'use strict';
    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        x,
        length,
        currTime,
        timeToCall;

    for (x = 0, length = vendors.length; x < length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[
            vendors[x] + 'RequestAnimationFrame'
        ];
        window.cancelAnimationFrame = window[
            vendors[x] + 'CancelAnimationFrame'
        ] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            lastTime = currTime + timeToCall;
            return window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}(window));

  /* NodeCopterStream: */
  (function (window, document, undefined) {
      'use strict';
      var NS,
          socket,
          avc,
          webGLCanvas,
          width,
          height,
          callbackOnce = null;

      function setupAvc() {
          avc = new Avc();
          avc.configure({
              filter: 'original',
              filterHorLuma: 'optimized',
              filterVerLumaEdge: 'optimized',
              getBoundaryStrengthsA: 'optimized'
          });
          avc.onPictureDecoded = handleDecodedFrame;
      }

      function handleNalUnits(message) {
          avc.decode(new Uint8Array(message.data));
      }

      function handleDecodedFrame(buffer, bufWidth, bufHeight) {
          var callback;

          requestAnimationFrame(function () {
              var lumaSize = bufWidth * bufHeight,
                  chromaSize = lumaSize >> 2;

              webGLCanvas.YTexture.fill(buffer.subarray(0, lumaSize));
              webGLCanvas.UTexture.fill(buffer.subarray(lumaSize, lumaSize + chromaSize));
              webGLCanvas.VTexture.fill(buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize));
              webGLCanvas.drawScene();
          });

          // call callback with Y portion (grayscale image)
          if (null !== callbackOnce && width) {
              callback = callbackOnce;
              callbackOnce = null;
              // decoded buffer size may be larger,
              // so use subarray with actual dimensions
              callback(buffer.subarray(0, width * height));
          }
      }

      function setupCanvas(div) {
          var canvas = document.createElement('canvas');

          width = div.attributes.width ? div.attributes.width.value : 640;
          height = div.attributes.height ? div.attributes.height.value : 360;

          canvas.width = width;
          canvas.height = height;
          canvas.style.backgroundColor = "#333333";
          div.appendChild(canvas);

          webGLCanvas = new YUVWebGLCanvas(canvas, new Size(width, height));
      }


      NS = function (div, options) {
          var hostname, port;
          options = options || {};
          hostname = options.hostname || window.document.location.hostname;
          port = options.port || window.document.location.port;

          setupCanvas(div);
          setupAvc();

          // socket = new WebSocket(
          //      'ws://' + hostname + ':' + port + '/dronestream'
          // );
          // socket.binaryType = 'arraybuffer';
          // socket.onmessage = handleNalUnits;

          console.log("Connecting to drone");

          // tcpVideoStream.connect();
          // tcpVideoStream.on('error', function (err) {
          //   // console.log(err.message);
          //   // tcpVideoStream.end();
          //   // tcpVideoStream.emit("end");
          //   // init();
          // });
          // //
          // // parser = new Parser();
          // tcpVideoStream.on('data', function (data) {
          // //   console.log(data);
          //   parser.write(data);
          // });
          // //
          // parser.on('data', function (data) {
          //   handleNalUnits(data.payload);
          // });
          //
          // parser.on('end', function(data) {
          //   output.end();
          // });

          // tcpVideoStream.pipe(parser);
      };

      // enqueue callback oto be called with next (black&white) frame
      NS.prototype.onNextFrame = function (callback) {
          callbackOnce = callback;
      };

      window.NodecopterStream = NS;

  }(window, document, undefined));

// UX code
  angular
    .module('ForgeMod', [
      'ngRoute',
      'ngResource',
      'ui.router',
      'ngAnimate',
      'ui.bootstrap',
      'ui.utils',
      'ngDragDrop',
      'ngWebSocket',
      'ng.epoch',
      'ui.ace'
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('fly', {
          url:            '/',
          templateUrl:    'views/fly.html',
          controller:     'FlightCtrl'
        })
        .state('mission', {
          url:            '/',
          templateUrl:    'views/mission.html',
          controller:     'MissionCtrl'
        })
        .state('code', {
          url:            '/',
          templateUrl:    'views/code.html',
          controller:     'CodeCtrl'
        })
        .state('forge', {
          url:            '/',
          templateUrl:    'views/forge.html',
          controller:     'ForgeCtrl'
        })
      ;
    })
    // Want this to be a service so the mission data can be preserved.
    .factory('MissionPlayer', function($timeout) {
      var missionData = [];

      var compiledMission = {
        emt: NaN,
        ok: false,
        currentMission: NaN,
        error: null,
        statusText: null,
        progress: {
          primary: {
            type: 'success',
            value: 0
          },
          move: {
            type: 'danger',
            value: 0
          },
          maneuver: {
            type: 'info',
            value: 0
          },
          leds: {
            type: 'warning',
            value: 0
          }
        }
      };

      function move(array, old_index, new_index) {
        if (new_index >= array.length || new_index < 0) {
          return array;
        } else {
          return array.splice(new_index, 0, array.splice(old_index, 1)[0]);
        }
      }

      return {
        addMission: function(mission) {
          missionData.push(angular.copy(mission));
        },
        removeMission: function(index) {
          missionData.splice(index, 1);
        },
        moveMissionUp: function(index) {
          if (index < missionData.length) {
            move(missionData, index, index+1);
          }
        },
        moveMissionDown: function(index) {
          if (index >= 0) {
            move(missionData, index, index-1);
          }
        },
        getMission: function() {
          return missionData;
        },
        getMissionStatus: function() {
          return compiledMission;
        },
        // Does not actually run the mission, just checks for errors.
        compileMission: function() {
          compiledMission.emt = 5000;
          compiledMission.ok = false;

          compiledMission.progress = {
            primary: {
              type: 'success',
              value: 0
            },
            move: {
              type: 'danger',
              value: 0
            },
            maneuver: {
              type: 'info',
              value: 0
            },
            leds: {
              type: 'warning',
              value: 0
            }
          };

          angular.forEach(missionData, function(data) {
            switch (data.kind) {
              case 'primary':
                if (data.duration < 100 || data.duration > 100000) {
                  compileMission.error = "Out of Range: " + data.duration;
                  return;
                } else if (!data.commandSelect) {
                  compileMission.error = "Undefined Command";
                  return;
                } else {
                  compiledMission.emt += data.duration;
                  compiledMission.progress.primary.value += data.duration;
                }
                break;
              case 'move':
                if (data.duration < 100 || data.duration > 100000) {
                  compileMission.error = "Out of Range: " + data.duration;
                  return;
                } else if (!data.commandSelect) {
                  compileMission.error = "Undefined Command";
                  return;
                } else if (data.amount < 0 || data.amount > 1) {
                  compileMission.error = "Out of Range: " + data.amount;
                  return;
                } else {
                  compiledMission.emt += data.duration;
                  compiledMission.progress.move.value += data.duration;
                }
                break;
              case 'maneuver':
                if (data.duration < 100 || data.duration > 100000) {
                  compileMission.error = "Out of Range: " + data.duration;
                  return;
                } else if (!data.commandSelect) {
                  compileMission.error = "Undefined Command";
                  return;
                } else {
                  compiledMission.emt += data.duration;
                  compiledMission.progress.maneuver.value += data.duration;
                }
                break;
              case 'leds':
                if (data.duration < 1 || data.duration > 100) {
                  compileMission.error = "Out of Range: " + data.seconds;
                  return;
                } else if (!data.commandSelect) {
                  compileMission.error = "Undefined Command";
                  return;
                } else if (data.freq < 0 || data.freq > 60) {
                  compileMission.error = "Out of Range: " + data.freq;
                  return;
                } else {
                  compiledMission.emt += 100;
                  compiledMission.progress.leds.value += data.duration;
                }
                break;
              default:
                compileMission.error = "Unknown type: " + data.kind;
                return;
            }
          });

          // calculate progressbar
          compiledMission.progress.primary.percent =
            Math.floor((compiledMission.progress.primary.percent / compiledMission.emt) * 100);
          compiledMission.progress.move.percent =
            Math.floor((compiledMission.progress.move.percent / compiledMission.emt) * 100);
          compiledMission.progress.maneuver.percent =
            Math.floor((compiledMission.progress.maneuver.percent / compiledMission.emt) * 100);
          compiledMission.progress.leds.percent =
            Math.floor((compiledMission.progress.leds.percent / compiledMission.emt) * 100);

          compiledMission.ok = true;
        },
        runMission: function() {
          if (!compiledMission.ok) {
            compileMission.error = "Mission not compiled properly!";
            return;
          }

          compiledMission.currentMission = -1;

          var missionIter = angular.copy(missionData);
          var iter = missionIter[0];

          compiledMission.statusText = "Initial take off.";
          client.takeoff();

          function processCmd() {
            client.stop();
            if (missionIter.length <= 0) {
              compiledMission.statusText = "Mission completed. Landing.";
              compiledMission.currentMission++;
              client.land();
              return;
            }

            iter = missionIter.pop();
            compiledMission.currentMission++;
            switch (iter.kind) {
              case 'primary':
                client[iter.commandSelect]();
                $timeout(processCmd, iter.duration);
                compiledMission.emt-=iter.duration;
                compiledMission.statusText = "Primary command " + iter.commandSelect + " for " + iter.duration + "ms.";
                break;
              case 'move':
                client[iter.commandSelect](iter.amount);
                $timeout(processCmd, iter.duration);
                compiledMission.emt-=iter.duration;
                compiledMission.statusText = "Moving " + iter.commandSelect + " at " + iter.amount +  " for " + iter.duration + "ms.";
                break;
              case 'maneuver':
                client.animate(iter.commandSelect, iter.duration);
                $timeout(processCmd, iter.duration);
                compiledMission.emt-=iter.duration;
                compiledMission.statusText = "Performing maneuver " + iter.commandSelect + " for " + iter.duration + "ms.";
                break;
              case 'leds':
                client.animateLeds(iter.commandSelect, iter.freq, iter.seconds);
                $timeout(processCmd, 100);
                compiledMission.emt-=100;
                compiledMission.statusText = "Setting Glow " + iter.commandSelect + " at " + iter.freq +  "hz for " + iter.seconds + "seconds.";
                break;
            }
          }

          // Get the ball rolling.
          compiledMission.emt-=5000;
          $timeout(processCmd, 5000);

        }
      };
    })
    .controller('AppCtrl', function($scope, $log, $state, $modal, $interval, $rootScope) {
      $scope.status = null;
      $scope.currentIp = "192.168.1.1";
      $scope.telemetry = {};
      $scope.isConnected = false;
      $scope.DroneStatus = "Not connected";
      $state.go('fly');
      $scope.currentState = 'fly';
      $scope.alerts= [ ];
      var prevHeader =  0;

      $rootScope.leds = ['blinkGreenRed', 'blinkGreen', 'blinkRed', 'blinkOrange', 'snakeGreenRed',
        'fire', 'standard', 'red', 'green', 'redSnake', 'blank', 'rightMissile',
        'leftMissile', 'doubleMissile', 'frontLeftGreenOthersRed',
        'frontRightGreenOthersRed', 'rearRightGreenOthersRed',
        'rearLeftGreenOthersRed', 'leftGreenRightRed', 'leftRedRightGreen',
        'blinkStandard'];

      $rootScope.flightPerfs = ['phiM30Deg', 'phi30Deg', 'thetaM30Deg', 'theta30Deg', 'theta20degYaw200deg',
        'theta20degYawM200deg', 'turnaround', 'turnaroundGodown', 'yawShake',
        'yawDance', 'phiDance', 'thetaDance', 'vzDance', 'wave', 'phiThetaMixed',
        'doublePhiThetaMixed', 'flipAhead', 'flipBehind', 'flipLeft', 'flipRight'];


      client.on('navdata', function(data) {
        $scope.telemetry = data;
        prevHeader = data.header;
        $scope.isConnected = true;
        $scope.DroneStatus = "Connected on " + $scope.currentIp;
      });

      $interval(function () {
        if ($scope.telemetry.header == prevHeader) {
          $scope.isConnected = false;
        }
      }, 5000);

      $scope.addAlert = function(type, msg) {
        $scope.alerts.push({type: type, msg: msg});
      };

      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };

      $scope.changeState = function(name) {
        $state.go(name);
        $scope.currentState = name;
      };

      $scope.Parrot = function() {

        var modalInstance = $modal.open({
          animation: $scope.animationsEnabled,
          templateUrl: 'widgets/connectModal.html',
          controller: 'ConnectCtrl'
        });

        modalInstance.result.then(function (selectedItem) {
          client = drone.createClient({ip: selectedItem});

          if (!client) {
            $scope.addAlert('danger', 'Could not connect to a parrot');
            $scope.DroneStatus = 'Not connected';
            $scope.isConnected = false;
          } else {
            connection.reconnect();
            $scope.currentIp = selectedItem;
            $scope.DroneStatus = 'Attempting connection on ' + selectedItem + '...';
          }
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });
      };

    })
    .controller('FlightCtrl', function($scope, $timeout, $rootScope) {
      $scope.telemetry = {};
      $scope.isFlying = false;
      $scope.inMotion = false;
      $scope.currentMove = 0.2;
      $scope.currentRot = 0.2;

      $scope.leds = $rootScope.leds;
      $scope.flightPerfs = $rootScope.flightPerfs;

      $scope.selectedLed = $scope.leds[0];
      $scope.flightPerf = 'wave';
      $scope.graphSelect = 'altitude';

      /*
       * Class for generating real-time data for the area, line, and bar plots.
       */
       function generateLineData () {
         var data1 = [{label: 'Layer 1', values: []}];
         for (var i = 0; i <= 128; i++) {
             var x = 20 * (i / 128) - 10,
                 y = Math.cos(x) * x;
             data1[0].values.push({x: x, y: y});
         }
         var data2 = [
             {label: 'Layer 1', values: []},
             {label: 'Layer 2', values: []},
             {label: 'Layer 3', values: []}
         ];
         for (var i = 0; i < 256; i++) {
             var x = 40 * (i / 256) - 20;
             data2[0].values.push({ x: x, y: Math.sin(x) * (x / 4) });
             data2[1].values.push({ x: x, y: Math.cos(x) * (x / Math.PI) });
             data2[2].values.push({ x: x, y: Math.sin(x) * (x / 2) });
         }
         return data2;
       }
      var RealTimeData = function(layers) {
          this.layers = layers;
          this.timestamp = ((new Date()).getTime() / 1000)|0;
      };

      RealTimeData.prototype.rand = function() {
          return parseInt(Math.random() * 100) + 50;
      };

      RealTimeData.prototype.history = function(entries, data) {
          if (typeof(entries) != 'number' || !entries) {
              entries = 60;
          }

          var history = [];
          for (var k = 0; k < this.layers; k++) {
              history.push({ values: [] });
          }

          for (var i = 0; i < entries; i++) {
              for (var j = 0; j < this.layers; j++) {
                  history[j].values.push({time: this.timestamp, y: data || 0});
              }
              this.timestamp++;
          }

          return history;
      };

      RealTimeData.prototype.next = function(data) {
          var entry = [];
          for (var i = 0; i < this.layers; i++) {
              entry.push({ time: this.timestamp, y: data || 0 });
          }
          this.timestamp++;
          return entry;
      }

      window.RealTimeData = RealTimeData;

      var liveLineData = new RealTimeData(2);

      $scope.realtimeArea = [{ label: 'Layer 1', values: [] }];
      $scope.realtimeAreaFeed = null;
      $scope.areaAxes = ['left','right','bottom'];

      $scope.lineData = generateLineData();
      $scope.lineAxes = ['right','bottom'];

      var chartEntry = [];

      // Realtime Line
      $scope.realtimeLine = liveLineData.history(0);
      // console.log($scope.realtimeLine);
      $scope.realtimeLineFeed = liveLineData.next(0);

      client.on('navdata', function(data) {
        $scope.telemetry = data;
        if (data && data.demo && data.droneState.flying) {
          switch ($scope.graphSelect) {
            case 'drift':  $scope.realtimeLineFeed = liveLineData.next(
              Math.sqrt(
                  data.demo.detection.camera.translation.x*data.demo.detection.camera.translation.x
                  + data.demo.detection.camera.translation.y*data.demo.detection.camera.translation.y
                  + data.demo.detection.camera.translation.z*data.demo.detection.camera.translation.z
                )); break;
            case 'altitude': $scope.realtimeLineFeed = liveLineData.next(data.demo.altitude); break;
            case 'yaw': $scope.realtimeLineFeed = liveLineData.next(data.demo.yaw); break;
            case 'pitch': $scope.realtimeLineFeed = liveLineData.next(data.demo.pitch); break;
            case 'roll': $scope.realtimeLineFeed = liveLineData.next(data.demo.roll); break;
            case 'xVelocity': $scope.realtimeLineFeed = liveLineData.next(data.demo.xVelocity); break;
            case 'yVelocity': $scope.realtimeLineFeed = liveLineData.next(data.demo.yVelocity); break;
            case 'zVelocity': $scope.realtimeLineFeed = liveLineData.next(data.demo.zVelocity); break;
          }
        }
      });


      $scope.Clear = function() {
        client.disableEmergency();
      }


      $scope.MoveUp = function(amt) {
        client.up(amt);
        if ($scope.telemetry.droneState.flying) {
          $scope.inMotion = true;
          $timeout(function() {
            $scope.Stop();
          }, 1000);
        }
      }
      $scope.MoveDown = function(amt) {
        client.down(amt);
        if ($scope.telemetry.droneState.flying) {
          $scope.inMotion = true;
          $timeout(function() {
            $scope.Stop();
          }, 1000);
        }
      }
      $scope.MoveLeft = function(amt) {
        client.left(amt);
        if ($scope.telemetry.droneState.flying) {
          $scope.inMotion = true;
          $timeout(function() {
            $scope.Stop();
          }, 1000);
        }
      }
      $scope.MoveRight = function(amt) {
        client.right(amt);
        if ($scope.telemetry.droneState.flying) {
          $scope.inMotion = true;
          $timeout(function() {
            $scope.Stop();
          }, 1000);
        }
      }

      $scope.Clockwise = function(amt) {
        client.clockwise(amt);
      }

      $scope.CounterClockwise = function(amt) {
        client.counterClockwise(amt);
      }

      $scope.Stop = function() {
        client.stop();
        $scope.inMotion = false;
      }

      $scope.Fly = function(fly) {
        if ($scope.telemetry.droneState.flying) {
          client.land();
        } else {
          client.takeoff();
        }

        $scope.isFlying = !$scope.isFlying;
      };

      $scope.LedAnimation = function(anim, speed, time) {
        client.animateLeds(anim, speed, time);
      }

      $scope.Maneuver = function(maneuver, dur) {
        client.animate(maneuver, dur);
      }

    })
    .controller('CodeCtrl', function($scope, $timeout) {
      $scope.world = "";

        // TODO this needs to be reafactored.
        // For now, just got the terminal in order.

        $scope.languages = [
          {'name': 'Javascript',
           'sampleCode':  "var drone = require('ar-drone')\n" +
                  "var client = drone.createClient(); \n\n" +
                  "client.takeoff();\n\n" +
                  "client.after(3000, function() { \n" +
                  "  this.stop();\n" +
                  "  this.land();\n" +
                  "});"
          },
          {'name': 'C/C++',
           'sampleCode':  "#include <iostream>\n\n" +
                  "int main(int argc, char* argv[]) {\n\n" +
                  " std::cout << \"Hello World\\r\\n\";\n\n" +
                  " return 0;\n" +
                  "}"
          }
        ];

        $scope.language = $scope.languages[0];
        var editor = null;
        var con = null;

        $scope.editorOptions = {
          theme:'twilight',
          animatedScroll: true,
          showPrintMargin: false,
          mode: $scope.language.name.toLowerCase(),
          onLoad: function (_editor) {
            editor = _editor;
            // var _session = _editor.getSession();
            // var _renderer = _editor.renderer;

            // _editor.setUndoManager(new ace.UndoManager());
            // _eidtor.getUndoManager().reset();

            // _editor.setShowPrintMargin(false);

            // $scope.languageChanged = function() {
            //   console.log(_session);
            //   if($scope.language.name === 'C/C++'){
            //     _session.setMode("ace/mode/" + 'c_cpp');
            //   }
            //   else{
            //     _session.setMode("ace/mode/" + $scope.language.name.toLowerCase());
            //   }
            // };
          }
        };

        $scope.consoleOptions = {
          theme:'twilight',
          animatedScroll: true,
          showPrintMargin: false,
          showLineNumbers: false,
          readonly: true,
          onLoad: function (_editor) {
            con = _editor;
          }
        };


        // HACK! Need to fix this
        var oldLog = console.log;
        console.log = function (message) {
          $scope.world += message + '\n';
          oldLog.apply(console, arguments);
        };


        // undo button
        $scope.undoBtn = function() {
          editor.undo();
        };

        $scope.redoBtn = function() {
          editor.redo();
        }

        // run and reset button
        $scope.run = function(){
          if($scope.language.name === 'C/C++') {
            $scope.world = [];
            $scope.world.push("[ERROR] C/C++ currently not supported by forge.\r\n");
            return;
          }
          if( $('div.ace_error').is(':visible') ){
            $scope.dynamic = 100;
            $scope.type = 'danger';
            $scope.message = 'Compiler Error :('
            $timeout(function(){$scope.world = 'Syntax error'}, 600);
          }
          else{
            $scope.dynamic = 100;
            $scope.message = 'Compiled Successfully :)';
            $scope.type = 'success';
            $scope.world = [];

            // HACK
            // quick and dirty.
            try {
              (new Function ('client',editor.getSession().getValue()))(client);
              console.log(editor.getSession().getValue());
            } catch(e) {
              $scope.world = '';
              $scope.world += "[Error] " + e;
              $scope.dynamic = 100;
              $scope.type = 'danger';
              $scope.message = 'Compiler Error :(';
            }

          }
        };

        $scope.land = function() {
          client.land();
        }

        $scope.reset = function(){
          $scope.dynamic = 0;
          $scope.type = null;
          $scope.world = '';
          $scope.message = '';
        };

    })
    .controller('MissionCtrl', function($scope, MissionPlayer) {

      $scope.missionPlayList = MissionPlayer.getMission();
      $scope.missionStatus = MissionPlayer.getMissionStatus();

      $scope.removeNode = function(index) {
        MissionPlayer.removeMission(index);
        MissionPlayer.compileMission();
      };

      $scope.NodeDown = function(index) {
        MissionPlayer.moveMissionDown(index);
      };

      $scope.NodeUp = function(index) {
        MissionPlayer.moveMissionUp(index);
      };

      $scope.runMission = function() {
        MissionPlayer.compileMission();
        MissionPlayer.runMission();
      }

      // Set up drag/drop logic
      // TODO - delete blocks
      // TODO - rearrange blocks
      // dragula([document.getElementById('missionQueue'),
      //   document.getElementById('missionBlocks')], {
      //   copy: true,
      //   removeOnSpill: true,
      //   accepts: function(el, target, source, sib) {
      //     if ((document.getElementById('missionBlocks') == source)
      //     && (document.getElementById('missionQueue') == target)) {
      //       return true;
      //     } else {
      //       return false;
      //     }
      //   }
      // })
      //   .on('drop', function(el) {
      //     if (el.parentElement.id == 'missionQueue') {
      //       // Note that newEl is by reference. If you try to deep copy this,
      //       // you'll get a type invocation error.
      //       // var newEl = $compile( el )( $scope );
      //       // $('missionQueue').append(newEl);
      //       // $scope.$broadcast('updateFormat', newEl);
      //
      //       // $('missionQueue').remove(el);
      //     }
      //   });

    })
    .controller('ForgeCtrl', function($scope) {

    })
    .controller('ConnectCtrl', function($scope, $modalInstance) {
      $scope.ok = function (form) {
        $modalInstance.close($scope.ipAddress);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    })
    .controller('MissionBlockCtrl', function($scope, $attrs, $element, $rootScope, MissionPlayer) {

      // $scope.duration = 1000;
      // $scope.cmd = null;

      var nodeInfo = null;

      // $scope.inUse = false;

      // $scope.$on('updateFormat', function(ev) {
      //   if ($element[0].parentElement.id == 'missionQueue') {
      //     $scope.inUse = true;
      //     $scope.$apply(function() {
      //       // $scope.$digest();
      //     });
      //   }
      // });

      $scope.leds = $rootScope.leds;
      $scope.flightPerfs = $rootScope.flightPerfs;

      $scope.type = $attrs.type;

      switch ($attrs.type) {
        default:
        case 'Primary':
          $scope.blockType = 'panel-success';
          $scope.blockName = 'Control Node';
          nodeInfo = {
            kind: 'primary',
            duration: 5000,
            commandSelect: 'takeoff'
          };
          break;
        case 'Move':
          $scope.blockType = 'panel-danger';
          $scope.blockName = 'Movement Node';
          nodeInfo = {
            kind: 'move',
            duration: 2000,
            commandSelect: 'up',
            amount: 0.2
          };
          break;
        case 'Maneuver':
          $scope.blockType = 'panel-info';
          $scope.blockName = 'Flight Maneuver Node';
          nodeInfo = {
            kind: 'maneuver',
            duration: 1000,
            commandSelect: 'wave',
          };
          break;
        case 'LEDs':
          $scope.blockType = 'panel-warning';
          $scope.blockName = 'Glow Node';
          nodeInfo = {
            kind: 'leds',
            seconds: 2,
            commandSelect: 'fire',
            freq: 5
          };
          break;
      }

      $scope.appendNode = function() {
        MissionPlayer.addMission(nodeInfo);
        MissionPlayer.compileMission();
      };

    })
    .directive('mission', function() {
      return {
        restrict: 'E',
        templateUrl: 'widgets/missionBlock.html',
        scope: {
          title: '=type'
        },
        controller: 'MissionBlockCtrl'
      }
    })
    .directive('navbar', function() {
      return {
          restrict: 'E',
          templateUrl: 'widgets/navbar.html'
      };
    })
  ;

})(window.App);
