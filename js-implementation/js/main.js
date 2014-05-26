$(document).ready(function () {
    /**
     * City
     */
    function City(iMinCoordinate, iMaxCoordinate) {
        this.x = this.getRandomCoordinate(iMinCoordinate, iMaxCoordinate);
        this.y = this.getRandomCoordinate(iMinCoordinate, iMaxCoordinate);
    }

    City.prototype = {

        /**
         * generates random coordinate
         *
         * @param iMin
         * @param iMax
         * @returns {number}
         */
        getRandomCoordinate: function (iMin, iMax) {
            return getRandomInRange(iMin, iMax);
        },

        /**
         * calculates the distance to a given city
         *
         * @param oCity
         * @returns {number}
         */
        getDistanceTo: function (oCity) {
            return Math.sqrt(Math.pow((this.x - oCity.x), 2) + Math.pow((this.y - oCity.y), 2));
        },

        /**
         * checks if euqal to a given city
         *
         * @param oCity
         * @returns {boolean}
         */
        equals: function (oCity) {
            return this.x == oCity.x && this.y == oCity.y;
        }
    };

    /**
     * Map
     */
    function Map(iMinCoordinate, iMaxCoordinate, iCityCount) {
        this.aCities = [];

        for (var i = 0; i < iCityCount; i++) {
            this.aCities.push(new City(iMinCoordinate, iMaxCoordinate));
        }
    }

    /**
     * Route
     */
    function Route(aCities) {
        this.aCities = aCities.slice(0);
        this.randomize();
    }

    Route.prototype = {

        /**
         * calculates the overall length of a route
         *
         * @returns {number}
         */
        getLength: function () {
            var iTotalLength = 0;
            for (var i = 0; i < this.aCities.length; i++) {
                if (i + 1 != this.aCities.length) {
                    iTotalLength += this.aCities[i].getDistanceTo(this.aCities[i + 1]);
                } else {
                    iTotalLength += this.aCities[i].getDistanceTo(this.aCities[0]);
                }
            }
            return iTotalLength;
        },

        /**
         * shuffles the cities to create a random distribution
         */
        randomize: function () {
            this.aCities = shuffle(this.aCities);
        },

        /**
         * produced a child with a given route by combining their genes
         *
         * @param oRoute
         * @returns {Route}
         */
        produceChildWith: function (oRoute) {
            var iMedian = Math.floor(this.aCities.length / 2);
            var oChild = new Route(this.aCities);

            var aFirstHalf = this.aCities.slice(0, iMedian);
            var aSecondHalf = oRoute.aCities.slice(iMedian);

            oChild.aCities = aFirstHalf;
            for (var i = 0; i < oRoute.aCities.length; i++) {
                var bCityAlreadyInChild = false;
                for (var j = 0; j < oChild.aCities.length; j++) {
                    if (oRoute.aCities[i].equals(oChild.aCities[j])) {
                        bCityAlreadyInChild = true;
                    }
                }
                if (!bCityAlreadyInChild) {
                    oChild.aCities.push(oRoute.aCities[i]);
                }
            }
            return oChild;
        },

        /**
         * mutates by swapping two points in the route
         */
        mutate: function () {
            var iFirstRandom = getRandomInRange(0, iCityCount);
            var iSecondRandom = getRandomInRange(0, iCityCount);
            this.aCities[iFirstRandom] = this.aCities.splice(iSecondRandom, 1, this.aCities[iFirstRandom])[0];

            for (var i = 0; i < this.aCities.length; i++) {
                if (typeof this.aCities[i] == 'undefined') {
                    this.aCities.splice(i, 1);
                }
            }
        }

    };

    /**
     * Population
     */
    function Population() {
    }

    Population.prototype = {

        /**
         * initializes the starting population
         */
        initPopulation: function () {
            var aRoutes = [];
            for (var i = 0; i < iInitialPopulation; i++) {
                aRoutes[i] = new Route(oMap.aCities);
            }
            this.aRoutes = aRoutes;
        },

        /**
         * sorts the routes by their fitness and lets only the given amount survive
         */
        filterFittestParents: function () {
            // sort the population by the distance and kill all except the fittest future parents
            this.aRoutes = this.aRoutes.sort(function (oRoute1, oRoute2) {
                if (oRoute1.getLength() > oRoute2.getLength()) {
                    return 1;
                } else if (oRoute1.getLength() < oRoute2.getLength()) {
                    return -1;
                } else {
                    return 0;
                }
            }).slice(0, iParentsCountPerPopulation);

            if (oBestRoute) {
                if (oBestRoute.getLength() > this.aRoutes[0].getLength()) {
                    oBestRoute = this.aRoutes[0];
                }
            } else {
                oBestRoute = this.aRoutes[0];
            }
        },

        /**
         * produces new population for the next evolution round
         *
         * @returns {Population}
         */
        getNextPopulation: function () {
            var aChildren = [];

            // sexy time
            for (var i = 0; i < this.aRoutes.length; i++) {
                for (var j = 0; j < this.aRoutes.length; j++) {
                    // we always need two parents
                    if (i != j) {
                        var oChild = this.aRoutes[i].produceChildWith(this.aRoutes[j]);
                        // mutate the child with the given probability
                        if (Math.random() <= fMutationProbability) {
                            oChild.mutate();
                            oChild.mutate();
                        }

                        aChildren.push(oChild);
                    }
                }
            }

            var oNewPopulation = new Population();
            oNewPopulation.aRoutes = aChildren.slice(0);

            return oNewPopulation;
        }
    };

    function Drawer() {
        this.oCanvas = $('#myCanvas');
        this.oCanvas.attr('width', iMapMaxLength).attr('height', iMapMaxLength);
    }

    Drawer.prototype = {

        /**
         * draws a point on canvas
         *
         * @param x
         * @param y
         */
        drawPoint: function (x, y) {
            this.oCanvas.drawArc({
                fillStyle: 'black',
                x: x, y: y,
                radius: 3
            });
        },

        /**
         * draws a line between two points
         *
         * @param x1
         * @param y1
         * @param x2
         * @param y2
         * @param sColor
         */
        drawLine: function (x1, y1, x2, y2, sColor) {
            this.oCanvas.drawLine({
                strokeStyle: (sColor ? sColor : '#000'),
                strokeWidth: 1,
                x1: x1, y1: y1,
                x2: x2, y2: y2
            });
        },

        /**
         * draws the number of evolution round
         *
         * @param iFrameNumber
         */
        drawFrameNumber: function(iFrameNumber) {
            this.oCanvas.drawText({
                fillStyle: '#000',
                //strokeStyle: '#25a',
                //strokeWidth: 2,
                x: 20, y: 10,
                fontSize: 10,
                fontFamily: 'Verdana',
                text: iFrameNumber
            });
        },

        /**
         * draws a map (all cities on the map as dots)
         *
         * @param oMap
         */
        drawMap: function (oMap) {
            if (oMap) {
                this.oMap = oMap;
            }
            for (var i = 0; i < this.oMap.aCities.length; i++) {
                this.drawPoint(this.oMap.aCities[i].x, this.oMap.aCities[i].y);
            }
        },

        /**
         * draws a complete route
         *
         * @param oRoute
         * @param sColor
         */
        drawRoute: function (oRoute, sColor) {
            for (var i = 0; i < oRoute.aCities.length; i++) {
                if (i + 1 != oRoute.aCities.length) {
                    this.drawLine(
                        oRoute.aCities[i].x,
                        oRoute.aCities[i].y,
                        oRoute.aCities[i + 1].x,
                        oRoute.aCities[i + 1].y,
                        sColor
                    );
                } else {
                    this.drawLine(
                        oRoute.aCities[i].x,
                        oRoute.aCities[i].y,
                        oRoute.aCities[0].x,
                        oRoute.aCities[0].y,
                        sColor
                    );
                }
            }
        }
    };

    var iMapMaxLength = 500;
    var iCityCount = 20;
    var iInitialPopulation = 100;
    var iGenerationCount = 500;
    var iParentsCountPerPopulation = 10;
    var fMutationProbability = 0.2;

    var oBestRoute;

    var oPopulation;
    var iCurrentGeneration = 0;
    var iFrameNumber = 0;

    // prepare to draw
    var oDrawer = new Drawer();

    // fiat lux
    var oMap = new Map(0, iMapMaxLength, iCityCount);
    oDrawer.drawMap(oMap);

    // the game begins
    function animate() {
        iCurrentGeneration++;
        iFrameNumber++;

        // clear
        oDrawer.oCanvas.clearCanvas();
        oDrawer.drawMap();
        oDrawer.drawFrameNumber(iFrameNumber);

        var oCurrentPopulation = $.extend(true, {}, oPopulation);
        oCurrentPopulation.filterFittestParents();
        oPopulation = oCurrentPopulation.getNextPopulation();

        if (iCurrentGeneration <= iGenerationCount){
            oDrawer.drawRoute(oPopulation.aRoutes[0]);
            // request new frame
            requestAnimFrame(function() {
                animate();
            });
        } else {

            var fDifference = 100 - 100 * (oBestRoute.getLength() / oPopulation.aRoutes[0].getLength());

            //console.log('genetically', oPopulation.aRoutes[0].getLength());
            console.log('overall', oBestRoute.getLength());
            //console.log('difference in %' + fDifference);

            if (fDifference > 0){
                oDrawer.drawRoute(oBestRoute, '#00FF00');
            } else {
                oDrawer.drawRoute(oPopulation.aRoutes[0]);
            }
        }
    }

    function updateValues() {
        iCityCount = $('#cityCount').val();
        iInitialPopulation = $('#initialPopulation').val();
        iGenerationCount = $('#generationCount').val();
        fMutationProbability = $('#mutationProbability').val();
    }

    $('button').button();

    $('#generateCities').click(function(){
        updateValues();
        oMap = new Map(0, iMapMaxLength, iCityCount);
        oDrawer.oCanvas.clearCanvas();
        oDrawer.drawMap(oMap);
    });

    $('#startRound').click(function(){

        updateValues();

        // init the population
        oPopulation = new Population();
        oPopulation.initPopulation();

        // init counters and variables
        iCurrentGeneration = 0;
        iFrameNumber = 0;
        oBestRoute = null;

        // start the search
        animate();
    });

    $('#resetCities').click(function(){
        oMap = new Map(0, iMapMaxLength, 0);
        oDrawer.oCanvas.clearCanvas();
    });

});