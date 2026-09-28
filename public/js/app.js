const svgNS = "http://www.w3.org/2000/svg";
const x = document.getElementById("demo");
const svg = document.getElementById("svg");
let floorgoal = document.getElementById("floor");
let currentfloor = 0;
// latitude is horizontal, x is horizontal too
//longitude is vertical, y is vertical too
const maxlong = 52.017550;
const maxlat = 4.683915;
const minlong = 52.016908;
const minlat = 4.684972;
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

function getClosestPoint(x, y) {
	//todo
	let pathPoints = genericPathPoints;
	let closest = 10000;
	let closestY = 10000;
	let closestX = 10000;
	for (const point of pathPoints) {
		if (point.used == true) {continue;}
		let differenceX = Math.abs(point.x - x);
		let differenceY = Math.abs(point.y - y);
		
		let total_distance = Math.sqrt((differenceX * differenceX) + (differenceY * differenceY));
		if (closest > total_distance && total_distance > 1) {
			closest = total_distance;
			closestY = point.y;
			closestX = point.x;
		}
	}
	return [closestX, closestY];
}

function changefloor(direction) {
	document.getElementById("floor" + currentfloor).hidden = true;
	currentfloor += direction;
	document.getElementById("floor" + currentfloor).hidden = false;
	if (currentfloor == 4) {
		document.getElementById("arrowup").disabled = true;
	} else if (currentfloor == 0) {
		document.getElementById("arrowdown").disabled = true;
	} else {
		document.getElementById("arrowup").disabled = false;
		document.getElementById("arrowdown").disabled = false;
	}
}

function translateUserCoordsToLocation() {
	if (userdifflong == Infinity) {
		return;
	}

	let difflong = maxlong - minlong;
	let userdifflong = userlocationx - minlong;
	let percentagelong = userdifflong / difflong * 100;
	let translatedpointlong = percentagelong * 6;
	
	let difflat = maxlat - minlat;
	let userdifflat = userlocationx - minlat;
	let percentagelat = userdifflat / difflat * 100;
	let translatedpointlat = percentagelat * 6;

	let point = {x: translatedpointlong, y: translatedpointlat}
	return point;
}

function whichIsCloser(x1, y1, x2, y2) {
	let difference1X = userlocationx - x1;
	let difference1Y = userlocationy - y1;
	let difference2X = userlocationx - x2;
	let difference2Y = userlocationy - y2;
	let distance1 = Math.sqrt((difference1X * difference1X) + (difference1Y * difference1Y));
	let distance2 = Math.sqrt((difference2X * difference2X) + (difference2Y * difference2Y));
	if (distance1 < distance2) {
		return [x1, y1];
	}
	return [x2, y2];
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

function drawroute() {
	let schoolPathPoints = genericPathPoints;
	if (userlocationx == Infinity) {
		return;
	}
	if (floorgoal != currentfloor) {
		//go to the stairs
		getClosestPoint()
	}

	//go to the class
	//todo
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
	svg.appendChild(circle);

}

function isRightDirection() {
	
}

for (const point of genericPathPoints) {
	drawdot(point);
}
let spot = 6;
let thingy = getClosestPoint(genericPathPoints[spot].x, genericPathPoints[spot].y);
drawLine(genericPathPoints[spot].x, genericPathPoints[spot].y, thingy[0], thingy[1]);
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

function success(position) {
	x.innerHTML = "Latitude: " + position.coords.latitude + "<br>Longitude: " + position.coords.longitude;
	userlocationx = position.coords.latitude;
	userlocationy = position.coords.longitude;
}

function error() {
	x.innerHTML = "Sorry, no position available.";
}

async function start() {
    try {
        let userlocation = await getLocation();
		userlocationx = userlocation.x
		userlocationy = userlocation.y
        drawroute();

        setInterval(async () => {
            await getLocation();
            drawroute();
        }, 1000);

    } catch (error) {
        console.log("Location permission denied");
    }
}

start();

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function() {
		navigator.serviceWorker
			.register("/js/serviceWorker.js")
			.then(function() {
				console.log("service worker registered")
			})
			.catch(function(err) {
				console.log("service worker not registered", err)
			})
	})
}