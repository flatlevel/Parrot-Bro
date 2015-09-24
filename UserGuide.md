# Forge User Guide

## Supported Platforms

Currently, Parrot AR Drone is the only tested platform.

## Connecting
First, if you wish to save mission data from flights, create a `flights/` and `videos/` directory in your home directory.

The default IP is **192.168.1.1**

You can assign another IP by clicking on the Forge button, and manually entering the IP. Your WiFi must be connected to the UAV. 


## Fly View

### First Person Video
Shows a live feed of video payload. During a mission, the video is streamed to a directory created in the root of the app's installed location, **only during a mission.**

*Note*: Currently, there is a bug where the video will lose connection after switching views.

### Control
#### Main 
**Takeoff:** Launches the drone to a preset altitude.

**Land:** Directs the drone to land at its present position.

**Stop Maneuver:** Holds the drone at its current location when flying.

**Clear:** Removes the drone from an error states, usually occuring during flight.

#### TRAN (Translation)
**up/down arrows:** Command the drone to increase/decrease altitude 

**left/right arrows**: strafe left or right.

**FWD/BWD**: move forwards or backwards. 

The box is the rate at which the UAV can move, a coefficiet from 0 to 1. The drone will move for a short period of time before holding its current position and altitude. 

#### ROT (Rotation)
Command the drone to turn about yaw. The box is the rate at which the UAV can turn, a coefficiet from 0 to 1. The drone will rotate for a short period of time before holding its current position and altitude. 

#### Flight
Command the UAV to perform a preset selection of flight maneuvers. 

#### LEDs
Command the UAV to change its LED colors and blinking pattern.

#### Errors
If there is an error encountered, it will be indicated in the control panel below the control widgets.

### Telemetry
ALT - Altitude, in meters.
HDG - Heading (yaw), in degrees.
PITCH - Pitch, in degrees.
ROLL - Roll, in degrees.
BAT - Battery, as a percentage. 
AIRSPD - Air Speed
YVEL - Y axis velocity
ZVEL - Z axis velocity

### Graph
Shows a real time feed of a particular data point, selected by the drop down below.

### Position
Shows a rough estimate of the drone's indoor position, about X and Y axis.

## Code View
The API provides access to underlying framework that communicates with the AR Drone. It is as follows:

client - represents the drone, as a javascript object.

`after(number, callback)`

Calls `callback` after `number` milliseconds.

The rest are api calls analoglous to the fly view commands. 

Control:

	takeoff()
	stop()
	land()

Movement:

	up([0,1])
	down([0,1])
	left([0,1])
	right([0,1])
	back([0,1])
	front([0,1])
	
Rotation:

	clockwise([0,1])
	counterClockwise([0,1])
	
Where `[0,1]` is a floating point number from 0 to 1, inclusive. 

## Mission View
The mission view allows you to create a *playlist* or sequence of command nodes. You can select a node from the right column and modify its parameters to build a mission playlist. Default nodes are take off and land control nodes, set for a specific time. Each node contains values, allowing you to modify things like the rate of movement and the duration. 

Control Node: Handles take off, landing, holding position. The default 

### During a mission
During a mission, the playlist execute each node in sequence, going down the list until it reaches the bottom. Mission data is stored in a `.json` stored in directory called `<HOME_DIR>/flights/` located in the root of the app. Each flight is named `flight_<date>.json` where `<date>` is the timestamp of when the flight began. Cloud view automatically syncs this with Forge's REST endpoint when connected to the internet. Video is streamed to a directory `<HOME_DIR>/videos/`. You may need to create these directories if they are not already made.

## Cloud
Cloud requires Forge to be running while connected to the internet, not the UAV. This view interfaces with Forge's REST endpoint, allowing you retrieve and view analysis on previous flights. The data is synced as soon as a user logs in. You must be connected to the internet to use this view. 

Each graph shows the flight history with the particular telemetry value on the Y axis, and the mission flight time in milliseconds. The data is collected from mission flights.

For an example, log in with the following user email / password:

	user: frankieh@skyworksas.com
	password: testtest

