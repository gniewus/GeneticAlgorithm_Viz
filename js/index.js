var population, stats, track;
var targets = [];
var step = 0;
var lifetime = 1000;
var generation = 0;
var maxForce = 0.5;
var populationSize = 64;
var elitePercentage = 20;
var globalCounter = 0;
var carsLeft = populationSize;
var blocks = [];
var block;
var collision;
var blockParams;
var nodes = new Set();
var links = new Set();
var window = this.window;
var fitnessChart;
var TargetReached = false;
var myChart;
var playing = true;

nodes.__proto__.has = function (val) {
    var entries = this.entries();
    var flag = false;
    entries.forEach(function (elem) {
        if (elem.carId == val.calId) {
            flag = true;
        }
    })
    return flag;
}

function setup() {

    var containerWidth = $("#game_container").width();
    
    var canvas = createCanvas(containerWidth, 400);
    blockParams = [
        {x: -100, y: -150, w: 200, h: 200},
        {x: 140, y: -150, w: 200, h: 200},
        {x: width - 100, y: -150, w: 200, h: 200},
        {x: -100, y: 90, w: 200, h: 200},
        {x: 150, y: 150, w: 240, h: 80},
        {x: 320, y: 80, w: 20, h: 50},
        {x: width - 100, y: 90, w: 200, h: 200},
        {x: -100, y: height - 50, w: 200, h: 200},
        {x: 140, y: height - 50, w: 200, h: 200},
        {x: width - 100, y: height - 50, w: 200, h: 200}
    ];
    canvas.parent('game_container');
    button = createButton('Stop');
    button.parent("cta");
    button.class("btn btn-info");
  //  button.attribute("data-step","6")
    //button.attribute("data-intro","This button stops the game anytime you want this")

    button.mousePressed((el) => {

        if (playing) {
            noLoop()
            button.html('play');
        } else {
            loop()
            button.html('pause');
        }
        playing = !playing;

    });
    repeatBtn = createButton('Replay');
  //  repeatBtn.attribute("data-step","5")
   // repeatBtn.attribute("data-intro","Start over the whole game !")
    repeatBtn.parent("navbarResponsive")
    repeatBtn.class("btn btn-danger")
    repeatBtn.mousePressed(function (argument) {    
            reset();
            reset_sankey();
            myChart.reset();
            removeData(myChart)
    })


    population = new Population(width - 50, height - 70, 5, 10);

    //this.generationCounter = text('Generation:', 10, 30);
    textSize(30);
    textAlign(CENTER, CENTER);
    fill(255);

    targets.push(
        new Target(180, 110, 25, 25)
    );
    stats = new Stats();

    for (var i = 0; i < blockParams.length; i++) {
        blocks.push(new Block(blockParams[i]))
    }

    window.sharedSpace = {
        population_size: populationSize,
        nodes: [...nodes],
        links: [...links]
    }

    collision = new Collision()
    fitnessChart = document.getElementById("myChart").getContext('2d');

}

function reset() {

    targets = [];
    step = 0;
    lifetime = 1000;
    generation = 0;
    maxForce = 0.5;
    populationSize = 64;
    elitePercentage = 20;
    globalCounter = 0;
    carsLeft = populationSize;
    nodes = new Set();
    links = new Set();
    population = new Population(width - 50, height - 70, 5, 10);

    this.generationCounter = text('Generation:', 10, 30);
    textSize(30);
    textAlign(CENTER, CENTER);
    fill(255);

    targets.push(
        new Target(120, 280, 20, 20)
    );

    for (var i = 0; i < blockParams.length; i++) {
        blocks.push(new Block(blockParams[i]))
    }
    stats.reset_data();

    window.sharedSpace.nodes = [...nodes];
    window.sharedSpace.links = [...links]

    appendNewData(window.sharedSpace)
    collision = new Collision()


}

function draw() {
    background(27, 27, 27);
    targets.forEach(function (target) {
        target.show()
    });

    blocks.forEach(function (block) {
        block.show()
    });

    text("Generation " + generation, width / 2, height / 2);
    text(step, 30, 20)
    population.run();

    step++;
    //stats.setCarsCount(carsLeft);
    if (step == lifetime || carsLeft <= 0) {


        population.evaluate();
        if (carsLeft <= 0) {
            window.sharedSpace = {
                population_size: populationSize,
                nodes: [...nodes],
                links: [...links]
            }

            try {
                if (generation == 1) {
                    intialize(window.sharedSpace);
                } else {
                    appendNewData(window.sharedSpace)
                }
            } catch (err) {
                console.log(err.message)
            }

        }
        step = 0;
        carsLeft = populationSize;

    }


}

function Block(params) {
    this.width = params.w || 10;
    this.height = params.h || 10;
    this.x = params.x || 0;
    this.y = params.y || 0;

    this.show = function () {
        fill(27, 27, 27);
        strokeWeight(3);
        stroke(150, 135, 135);
        rect(this.x, this.y, this.width, this.height)
    }
}

function Collision() {
    this.detect = function (posX, posY) {

        for (var i = 0; i < blocks.length; i++) {
            if (posX > blocks[i].x && posX < blocks[i].x + blocks[i].width && posY > blocks[i].y && posY < blocks[i].y + blocks[i].height) {
                // console.log(i)
                return true
            }
        }
    }
}

function Car(x, y, w, h, dna) {
    this.width = w;
    this.length = h;
    this.position = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.dna = dna ? dna : new DNA();
    this.fitness = 0;
    this.complited = false;
    this.disqualified = false;
    this.removed = false;
    this.step = 0;
    this.targetId = 0;
    this.color = '#11ba00';
    this.finish = false;
    this.carId = generateId();
    this.genTree = [];

    this.regenerateId = function () {
        return generateId()
    }

    this.damageCounter = 0;
    this.bounce = function (posX, posY, step) {
        this.damageCounter++;
        var lastStep = this.dna.getLastGene(step);
        var nextStep = this.dna.getNextGene(step);
        if (this.damageCounter == 1) {
            this.color = '#e6fe00'
        } else if (this.damageCounter == 2) {
            this.color = "#ad0001"
        }
        //  console.log(this.dna.genes[step])
        //this.dna.genes[step] = this.dna.genes[step].rotate(PI)
        //console.log(this.dna.genes[step])
        this.dna.genes[step + 1] = nextStep.rotate(PI / 2 * Math.random())
        this.applyForce(this.dna.genes[step])
        this.velocity.mult(-1)
        this.position.add(this.velocity);
        //this.acceleration.mult(0);

        //console.log(lastStep.x,nextStep.x,lastStep.y,lastStep.y)

    }
    var that = this;
    this.appendToList = function () {
        //Child
        nodes.add({
            'name': this.carId,
            'fitness': this.fitness,
            'size': 0,
            'complited': this.complited,
            'generation': generation,
        });

        this.genTree.forEach(function (elem) {
            //if there are two parents
            if (elem.length == 2) {
                //Create link from father
                links.add({
                    'source': elem[0],
                    'target': that.carId,
                    'generation': generation,
                    'type': 'crossover',
                    'op': 0

                })
                //Create link from mother
                links.add({
                    'source': elem[1],
                    'target': that.carId,
                    'generation': generation,
                    'type': 'crossover',
                    'op': 0
                })
            } else if (elem.length == 1) {
                links.add({
                    'source': elem[0],
                    'target': that.carId,
                    'type': 'elite',
                    'op': 1

                })
            }
        })
    }

    function generateId() {
        ctr = globalCounter;
        globalCounter++
        return ctr;
//        return parseInt(Math.random().toString(8).substr(2, 5));
    }

    this.removeFromList = function () {
        if (!this.removed) {
            carsLeft--;
            this.removed = true;
            this.step = step
        }
    };

    this.crossover = function (partner) {
        var child = new Car(x, y, w, h);
        var genesLength = this.dna.getLength();
        var midPoint = floor(random(genesLength));

        for (var i = 0; i < genesLength; i++) {
            if (i > midPoint) {
                child.dna.genes[i] = this.dna.genes[i]
            } else {
                child.dna.genes[i] = partner.dna.genes[i]
            }
        }
        child.genTree.push([this.carId, partner.carId])
        child.dna.mutation();

        return child;
    };

    this.mutate = function (child) {
        child.dna.mutation()
    }


    this.calcFitness = function () {
        var distance = dist(this.position.x, this.position.y, targets[this.targetId].position.x, targets[this.targetId].position.y);

        // this.fitness =
        //this.fitness =
        //this.fitness =
        //console.log(norm(distance, 0, 100),( 1 / distance),map(distance, 0, width, width, 0));
        //this.fitness = distance/this.dna.genes.length
        this.fitness = 1 / distance * 100;


        if (this.complited) {
            this.fitness *= 1 + (1000 / this.step)
        }

        // if(this.disqualified) {
        //   this.fitness *= this.step
        // }
        // this.fitness = floor(this.fitness, 2)
        // console.log(this.fitness)
    };

    this.applyForce = function (force) {

        this.acceleration.add(force);
    };

    this.changeTarget = function () {

        var colors = [
            '#4124fb',
            '#fc0d1b',
            'yellow',
            'black'
        ];

        if (this.complited) {
            var targetId = this.targetId + 1;

            this.color = colors[targetId];

            if (targetId < targets.length) {
                this.targetId = targetId;
                this.complited = false

                // console.log(this.targetId)
            } else {
                this.finish = true;
                this.complited = true;
                this.removeFromList()
            }
        }
    };

    this.move = function () {

        // var distance = dist(this.position.x, this.position.y, targets[this.targetId].position.x, targets[this.targetId].position.y)
        // if(distance < (targets[this.targetId].width/2)) {
        //   this.complited = true
        //   this.changeTarget()
        // }
        // console.log(targets[this.targetId])

        if (targets[this.targetId].detect(this.position.x, this.position.y)) {
            this.complited = true;
            this.changeTarget()
            this.fitness = 100;
        }


        if (!this.disqualified && collision.detect(this.position.x, this.position.y)) {

            this.disqualified = true;
            this.removeFromList()


        }


        if (!this.disqualified) {
            //Out from map
            if (this.position.x > width ||
                this.position.x < 0 ||
                this.position.y > height ||
                this.position.y < 0
            ) {


                this.disqualified = true;
                this.removeFromList()

            }
        }

        this.applyForce(this.dna.genes[step]);

        if (!this.finish && !this.disqualified) {
            this.velocity.add(this.acceleration);
            this.position.add(this.velocity);
            this.acceleration.mult(0)
            this.velocity.limit(4)
        }

        this.design()
    };

    this.design = function () {
        push();
        noStroke();
        translate(this.position.x, this.position.y);
        rotate(this.velocity.heading());
        rectMode(CENTER);
        fill(this.color);
        rect(0, 0, this.length, this.width);
        pop()
    }
}

function Population(x, y, w, h) {
    this.cars = [];
    this.size = populationSize;


    for (var i = 0; i < this.size; i++) {
        this.cars[i] = new Car(x, y, w, h)
    }

    this.evaluate = function () {
        // Calculate maximum fitness

        var maxFitness = 0;
        for (var i = 0; i < this.size; i++) {
            this.cars[i].calcFitness();
            if (this.cars[i].fitness > maxFitness) {
                maxFitness = this.cars[i].fitness
            }
            this.cars[i].appendToList();
        }


        //stats.setMaxFitness(maxFitness);

        // Calculate average fitness
        var sumFitness = 0;
        for (var i = 0; i < this.size; i++) {
            sumFitness += this.cars[i].fitness
        }
        //stats.setAvgFitness(sumFitness / this.size);

        stats.appendNewRecord([maxFitness, sumFitness / this.size])

        // Fitness normalization fitness/maxFitness
        for (var i = 0; i < this.size; i++) {
            if (this.cars[i].complited) {
                TargetReached = true;
            }
            //this.cars[i].fitness /= maxFitness
            // this.cars[i].fitness = norm(this.cars[i].fitness, 0, 10)
        }


        this.cars = this.cars.sort(function (a, b) {
            if (a.fitness > b.fitness) {
                return -1;
            } else if (a.fitness < b.fitness) {
                return 1
            } else {
                return 0;
            }
        })


        this.matingPool = [];
        for (var i = 0; i < this.size; i++) {
            var n = this.cars[i].fitness * 1000;
            for (var j = 0; j < n; j++) {
                this.matingPool.push(this.cars[i])
            }
        }
        //

        this.elite = this.cars.slice(0, 12);

        this.cars = []
        // this.cars.push(...eliteKids);
        // console.log("Elite", this.cars)
        this.breed();

        generation++;


    };

    // This function is responsible for breedin, that is random picking of parent A and B and doing crosover between them
    this.breed = function () {


         //var eliteCarsNumber = parseInt((elitePercentage / 100) * this.size);
         var eliteClones = this.elite.map(function (car) {
              var child = new Car(x, y, w, h);
             child.dna.genes = car.dna.genes;
             child.genTree.push([car.carId]);
              return child;
         });

        for(var k=0;k<this.elite.length;k++){
            this.cars.push(eliteClones[k])
         }

        var currCarsCount = population.size - this.cars.length
        console.log(population.size, this.cars.length)

        for (var i = 0; i < currCarsCount; i++) {
            var parentA = random(this.matingPool);
            var parentB = random(this.matingPool);
            var child = parentA.crossover(parentB);
            this.cars.push(child)
        }
    };

    this.run = function () {
        for (var i = 0; i < population.size; i++) {
            this.cars[i].move()
        }
    }
}

function DNA() {
    this.genes = [];

    for (var i = 0; i < lifetime; i++) {
        this.genes[i] = p5.Vector.random2D();
        this.genes[i].setMag(maxForce)
    }
    this.getNextGene = function (step) {
        return this.genes[step + 1]
    }
    this.getLastGene = function (step) {
        return this.genes[step - 1]
    }

    this.getLength = function () {
        return this.genes.length
    };

    this.mutation = function () {
        for (var i = 0; i < this.getLength(); i++) {
            if (random(1) < 0.01) {
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(maxForce)
            }
        }
    }
}

function Target(x, y, w, h) {
    this.position = createVector(x, y);
    this.width = w;
    this.height = h;

    this.show = function () {
        // fill(22, 183, 45)
        fill(255, 255, 255);
        noStroke();
        ellipse(this.position.x, this.position.y, this.width, this.height)
    };

    this.detect = function (posX, posY) {
        if (posX > this.position.x &&
            posX < this.position.x + this.width / 2 &&
            posY > this.position.y &&
            posY < this.position.y + this.height / 2) {
            return true
        }
    }
}


function Stats() {
    //this.populationSizeText = createP();
    //this.maxFitnessText = createP();
    //this.avgFit   nessText = createP();
    //this.stepsText = createP();
    //this.carsCountText = createP();
    //this.populationSizeText.html('population size: ' + populationSize);
    //this.populationSizeText.parent('line-chart');
    //this.carsCountText.parent('line-chart');
    //this.maxFitnessText.html('max fitness: 0');
    //this.avgFitnessText.html('avg fitness: 0');
    //this.stepsText.html('steps: 0');
    //this.carsCountText.html('cars left: ' + populationSize);
    this.stats_data = {max: [], avg: []};


    this.reset_data = function () {
        this.stats_data = {max: [], avg: []};
    };


    this.appendNewRecord = function (value) {
        addData(myChart, generation, [value[0], value[1]])
    }

    this.setMaxFitness = function (value) {
        this.stats_data.max.push(value)
        this.maxFitnessText.html('max fitness: ' + value)
    };

    this.setAvgFitness = function (value) {
        // this.stats_data.avg.push(value)
        this.avgFitnessText.html('avg fitness: ' + value)
    };


    this.setSteps = function (value) {
        this.stepsText.html('steps: ' + value)
    };

    this.setCarsCount = function (value) {
        this.carsCountText.html('cars left: ' + value)
    }

}


window.onload = function () {

    myChart = new Chart.Line(fitnessChart, {

        type: 'Line',
        data: {
            datasets: [{
                label: 'Max fitness',
                borderWidth: 0.9,

                data: stats.stats_data.max,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                fill: false,
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
            }, {
                label: 'Avg fitness',
                borderWidth: 0.9,

                data: stats.stats_data.avg,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                fill: false,
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
            }
            ]
        },
        options: {
            responsive:true,
            maintainAspectRatio: false,
            skipNullValues: true,
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Generation',
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Fitness'
                    }
                }]
            }
        }
    });

}

function addData(chart, label, data) {
    chart.data.labels.push(label);
    console.info(chart.data.datasets)
    var ctr = 0;
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data[ctr]);
        ctr++
    });
    chart.update();
}

function removeData(chart) {
    chart.data.labels = []
    chart.data.datasets.forEach((dataset) => {
        dataset.data = []
    });
    chart.update();
}

function mousePressed(el) {


}