const svgNS = "http://www.w3.org/2000/svg";
const x = document.getElementById("demo");
const svg = document.getElementById("svg");
let floorgoal = document.getElementById("floor");
let currentfloor = 0;
// latitude is horizontal, x is horizontal too
//longitude is vertical, y is vertical too
const maxlong = 52.017550;
const minlat = 4.683915;
const minlong = 52.016908;
const maxlat = 4.684972;
let userlocationx = Infinity;
let userlocationy = Infinity;
const floors = {
    0: floor0,
    1: floor1,
    2: floor2,
    3: floor3,
    4: floor4
};
//topleft: 52.017550, 4.683915
// bottomright: 52.016908, 4.684972
function getClickPosition(e) {
	const point = svg.createSVGPoint();
	point.x = e.clientX;
	point.y = e.clientY;
	const svgPoint = point.matrixTransform(
		svg.getScreenCTM().inverse()
	);
	console.log(`{x: ${svgPoint.x}, y: ${svgPoint.y}},`);
}

function getClosestPoint(x, y, goal, pathPoints) {
    let closest = Infinity;
    let closestKey = -1;

    const currentDistanceToGoal =
        (goal.x - x) ** 2 +
        (goal.y - y) ** 2;

    for (let key = 0; key < pathPoints.length; key++) {
        const point = pathPoints[key];

        if (point.used) continue;

        const dx = point.x - x;
        const dy = point.y - y;
        const distance = dx * dx + dy * dy;

        const goalDistance =
            (goal.x - point.x) ** 2 +
            (goal.y - point.y) ** 2;

        // Don't choose points that move us farther from the goal
        if (goalDistance >= currentDistanceToGoal) continue;

        if (distance < closest && distance > 1) {
            closest = distance;
            closestKey = key;
        }
    }

    if (closestKey === -1) {
        return null;
    }

    return {
        x: pathPoints[closestKey].x,
        y: pathPoints[closestKey].y,
        key: closestKey
    };
}

function changefloor(direction) {
	document.getElementById("floor" + currentfloor).hidden = true;
	currentfloor += direction;
	document.getElementById("currentfloor").innerHTML = currentfloor;
	document.getElementById("floor" + currentfloor).hidden = false;
	if (currentfloor == 4) {
		document.getElementById("arrowup").disabled = true;
	} else if (currentfloor == 0) {
		document.getElementById("arrowdown").disabled = true;
	} else {
		document.getElementById("arrowup").disabled = false;
		document.getElementById("arrowdown").disabled = false;
	}
	if (userlocationx !== Infinity) {
        drawroute();
    }
}
changefloor(0);
function getGoal() {
	let location = {x:0, y:0};
	floorgoal = document.getElementById("floor").value;
	if (floorgoal != currentfloor) {
		location = specialPoints.stairs;
	} else {
		let intentedfloor = floors[floorgoal];
		location = intentedfloor[document.getElementById("classroom").value];
	}
	// console.log(intentedfloor[document.getElementById("classroom").value].x);
	
	return location;
}

function drawUserLocation() {
	console.log("drawn user");
	let mylocation = translateUserCoordsToLocation();
	console.log(mylocation.x);
	drawdot(mylocation);
}

function translateUserCoordsToLocation() {
	if (userlocationx == Infinity) {
		return;
	}

	let difflong = maxlong - minlong;
	let userdifflong = userlocationx - minlong;
	let percentagelong = userdifflong / difflong * 100;
	let translatedpointlong = percentagelong * 6;
	
	let difflat = maxlat - minlat;
	let userdifflat = userlocationy - minlat;
	let percentagelat = userdifflat / difflat * 100;
	let translatedpointlat = percentagelat * 6;
	//check when in english which is more accurate
	let point = {x: translatedpointlat - 40, y: 600 - translatedpointlong}
	// let point = {x: 600 - translatedpointlat, y: 600 - translatedpointlong}
	return point;
}

function isFirstCloser(x1, y1, x2, y2, goal) {
    let difference1X = goal.x - x1;
    let difference1Y = goal.y - y1;

    let difference2X = goal.x - x2;
    let difference2Y = goal.y - y2;

    let distance1 = difference1X * difference1X + difference1Y * difference1Y;
    let distance2 = difference2X * difference2X + difference2Y * difference2Y;

    return distance1 < distance2;
}

function drawLine(startX, startY, endX, endY) {
	const line = document.createElementNS(svgNS, "line");
	line.setAttribute("x1", startX);
	line.setAttribute("y1", startY);
	line.setAttribute("x2", endX);
	line.setAttribute("y2", endY);
	line.setAttribute("class", "line");
	svg.appendChild(line);
}

function changeFloorIntent() {
	let classroomoptions = document.getElementById("classroom");
	removeOptions(classroomoptions);
	classroomoptions.disabled = false;
	
	for (const classroom of Object.keys(floors[floorgoal.value])) {
		const option = document.createElement("option");
		option.value = classroom;
		option.textContent = classroom;
		classroomoptions.appendChild(option);
	}
}

function removeOptions(selectElement) {
   var i, L = selectElement.options.length - 1;
   for(i = L; i >= 0; i--) {
      selectElement.remove(i);
   }
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function erasePreviousRoute() {
    document.querySelectorAll("svg .line, svg circle").forEach(element => {
        element.remove();
    });
}

function drawroute() {
	erasePreviousRoute();
	console.log("tries to draw initialisation");
	//erase all existing points too
	let schoolPathPoints = structuredClone(genericPathPoints);
	schoolPathPoints = eliminateFurtherOptions(schoolPathPoints);
	if (userlocationx == Infinity) {
		return;
	} //wont happen 
	drawUserLocation();
	//go to the stairs
	let goal = getGoal();
	let translateduserlocation = translateUserCoordsToLocation();
	let locationx = translateduserlocation.x;
	let locationy = translateduserlocation.y;
	let previousclosestx = locationx;
	let previousclosesty = locationy;
	while (true) {
		let closest = getClosestPoint(locationx, locationy, goal, schoolPathPoints);
		if (closest == null) {
			break
		}
		if (isFirstCloser(locationx, locationy, closest.x, closest.y, goal)) {
			break;
		}
		locationx = closest.x;
		locationy = closest.y;
		schoolPathPoints[closest.key].used = true;
		drawLine(locationx, locationy, previousclosestx, previousclosesty);
		previousclosestx = locationx;
		previousclosesty = locationy;
	}
	drawLine(previousclosestx, previousclosesty, goal.x, goal.y);
	console.log("sigh");
}

function drawdot(point) {
	const circle = document.createElementNS(
		svgNS,
		"circle"
	);

	circle.setAttribute("cx", Math.abs(point.x));
	circle.setAttribute("cy", Math.abs(point.y));
	circle.setAttribute("r", 5);
	circle.setAttribute("class", "circle");
	// svg.appendChild(circle);

}

function eliminateFurtherOptions(pathPoints) {
	//userlocationx
	for (let keynr = 0; keynr < pathPoints.length; keynr++) {
		let goal = getGoal();
		let translateduserlocation = translateUserCoordsToLocation();
		let distancefromgoalx = goal.x - pathPoints[keynr].x;
		let distancefromgoaly = goal.y - pathPoints[keynr].y;
		let userdistancefromgoalx = goal.x - translateduserlocation.x;
		let userdistancefromgoaly = goal.y - translateduserlocation.y;
		let distance1 = Math.sqrt((distancefromgoalx * distancefromgoalx) + (distancefromgoaly * distancefromgoaly));
		let distance2 = Math.sqrt((userdistancefromgoalx * userdistancefromgoalx) + (userdistancefromgoaly * userdistancefromgoaly));
		if (distance1 > distance2) {
			pathPoints[keynr].used = true;
		}
	}
	return pathPoints;
}

for (const point of genericPathPoints) {
	drawdot(point);
}
let spot = 6;
// let thingy = getClosestPoint(genericPathPoints[spot].x, genericPathPoints[spot].y);
// drawLine(genericPathPoints[spot].x, genericPathPoints[spot].y, thingy[0], thingy[1]);
// drawLine(genericPathPoints[0].x, genericPathPoints[0].y, genericPathPoints[1].x, genericPathPoints[1].y);

async function getLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            position => {
                resolve(position);
            },
            error => {
                reject(error);
            }
        );
    });
}

function error() {
	x.innerHTML = "Sorry, no position available.";
}
function start() {
    navigator.geolocation.watchPosition(
        position => {
            userlocationx = position.coords.latitude;
            userlocationy = position.coords.longitude;

            if (document.getElementById("classroom").value != "unusable") {
                drawroute();
            } else {
                console.log("ignoring correctly");
            }
        },
        error => {
            console.log("Location permission denied");
        }
    );
}

start();

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function() {
		navigator.serviceWorker
			.register("serviceWorker.js")
			.then(function() {
				console.log("service worker registered")
			})
			.catch(function(err) {
				console.log("service worker not registered", err)
			})
	})
}