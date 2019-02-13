/**
 * Created by tomasztkaczyk on 30.12.18.
 */
// helper function

function loader(config) {
    return function () {
        var radius = Math.min(config.width, config.height) / 2;
        var tau = 2 * Math.PI;

        var arc = d3.svg.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 0.9)
            .startAngle(0);

        var svg = d3.select(config.container).select("svg")
            .append("g")
            .attr("id", "spiner")
            .attr("transform", "translate(" + config.width / 2 + "," + config.height / 2 + ")")

        var background = svg.append("path")
            .datum({endAngle: 0.33 * tau})
            .style("fill", "#182a4d")
            .attr("d", arc)
            .call(spin, 1500)

        function spin(selection, duration) {
            selection.transition()
                .ease("linear")
                .duration(duration)
                .attrTween("transform", function () {
                    return d3.interpolateString("rotate(0)", "rotate(360)");
                });

            setTimeout(function () {
                spin(selection, duration);
            }, duration);
        }

        function transitionFunction(path) {
            path.transition()
                .duration(7500)
                .attrTween("stroke-dasharray", tweenDash)
                .each("end", function () {
                    d3.select(this).call(transition);
                });
        }

    };
}


function range1(i) {
    return i ? range1(i - 1).concat(i) : []
}


var evolution_height = window.innerHeight / 2;
var evolution_width = $("#evolution").parent().parent().width();


var margin = {top: 5, right: 20, bottom: 5, left: 20},
    width = evolution_width - margin.left - margin.right,
    height = evolution_height - margin.top - margin.bottom;

var format_number = d3.format("4.2f"),
    format = function (d) {
        str = "Fitness: " + format_number(d.fitness);
        str += " ,size: " + d.size + "(" + format_number(d.scaled_size) + ")";
        str += " ,height: " + d.height + "(" + format_number(d.scaled_height) + ")";
        return str;
    };
//color = d3.scale.category20();

var svg = d3.select("#evolution").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("class", "aligned")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var flowchart = d3.flowchart()
    .node_width(12)
    .node_height(5)
    .size([width, height]);

flowchart.sort_type($('input[name=sort_type]:checked').val());
flowchart.scale_type($('input[name=scale_type]:checked').val());

var path = flowchart.link();

var fitness_color = null,
    size_color = null,
    height_color = null;
var link_color = d3.scale.ordinal()
    .domain([-1, 0, 1, 2])   // elite, mutation, crossover, reproduce
    // .range(colorbrewer.Set1[4])
    .range(["red", "blue", "green", "yellow"]);


function intialize(data) {
    console.log(data);
    if (data.nodes.length > 0) {

        svg.selectAll("g").remove();
        // initialize the flowchart, create the graph
        flowchart.nodes(data.nodes)
            .links(data.links)
            .init();

        var i = 0,
            max_size = 0,
            max_height = 0;
        flowchart.nodes().forEach(function (node) {
            if (node.size > max_size) {
                max_size = node.size;
            }
            if (node.height > max_height) {
                max_height = node.height;
            }
        });
        flowchart.nodes().forEach(function (node) {
            node.scaled_size = 1.0 - node.size / max_size;
            node.scaled_height = 1.0 - node.height / max_height;
        });


        color_range = colorbrewer.RdYlGn[10];
        color_range_fitness = color_range.slice(0);  // clone array (deep copy)
        // color_range_fitness.reverse();
        // color_range = d3.scale.category20c()
        //     .domain( range1(20) )
        //     .range();
        fitness_color = d3.scale.quantile()
            .domain(data.nodes.map(function (n) {
                return n.fitness;
            }))
            .range(color_range_fitness);


        size_color = d3.scale.quantile()
            .domain(data.nodes.map(function (n) {
                return n.scaled_size;
            }))
            .range(color_range);
        height_color = d3.scale.quantile()
            .domain(data.nodes.map(function (n) {
                return n.scaled_height;
            }))
            .range(color_range);

        update_visualization();

        var d = flowchart.nodes()[flowchart.nodes().length - 1];

        svg.selectAll("path.link.ancestor-of-" + d.key)
            .classed("static-link-selected", true);

        svg.selectAll("g.node.ancestor-of-" + d.key + " rect")
            .classed("static-node-selected", true);
        var spiner = loader({width: evolution_width, height: window.innerHeight/2, container: "#evolution", id: "loader"});
        spiner();
    }

}

d3.selectAll("input[name=sort_type]").on("click", change_visualization);
d3.selectAll("input[name=scale_type]").on("click", change_visualization);
d3.selectAll("input[name=color_type]").on("click", change_color);

function get_node_color() {
    color_type = $('input[name=color_type]:checked').val();

    if (color_type == "fitness") {
        return function (d) {
            return fitness_color(d.fitness);
        }
    }
    if (color_type == "size") {
        return function (d) {
            return size_color(d.scaled_size);
        }
    }
    if (color_type == "height") {
        return function (d) {
            return height_color(d.scaled_height);
        }
    }
}
function reset_sankey() {

    flowchart.nodes([])
        .links([]).init();
    svg.selectAll(".node").remove();
    svg.selectAll(".link").remove();


}
function appendNewData(data) {


    var newNodes = data.nodes;
    var newLinks = data.links;
    var oldNodes = flowchart.nodes();
    var oldLinks = flowchart.links();

    /*  newNodes.filter(function (innerArrayItem) {

     return oldNodes.indexOf(innerArrayItem) >= 0;
     });
     newLinks.filter(function (innerArrayItem) {
     return oldLinks.indexOf(innerArrayItem) >= 0;
     });*/
   // console.info("new nodes", newNodes, "oldNodes ", oldNodes);


    var t = d3.transition()
        .duration(100);

    var i = 0, max_size = 0, max_height = 0;

    flowchart.nodes().forEach(function (node) {
        if (node.size > max_size) {
            max_size = node.size;
        }
        if (node.height > max_height) {
            max_height = node.height;
        }
    });
    flowchart.nodes().forEach(function (node) {
        node.scaled_size = 1.0 - node.size / max_size;
        node.scaled_height = 1.0 - node.height / max_height;
    });


    if (oldNodes.length > 256) {

    }

    flowchart.nodes(newNodes)
        .links(newLinks).init();

    if (newNodes.length >= 64) {
        d3.select("#spiner").transition(t).remove()
    }

    svg.selectAll(".node").remove();
    svg.selectAll(".link").remove();


    flowchart.layout();

    var node = svg.selectAll(".node")
        .data(flowchart.nodes(), function (d) {
            return d.key
        });

    node
        .enter().append("g")
        .attr("class", function (d) {
            str = "node";
            if (d.ancestor_of) {

                d.ancestor_of.forEach(function (d) {
                    str += " ancestor-of-" + d;
                });
            } else {
                console.error(d)

            }
            return str;
        })
        .attr("transform", function (d) {
            try {
                return "translate(" + d.x + "," + d.y + ")";
            } catch (err) {
                console.info(d);
                return
            }
        });
    node.exit().attr("transform", function (d) {
        try {
            return "translate(" + d.x + "," + d.y + ")";
        } catch (err) {
            console.info(d);
            return
        }
    });

    // append a rect to each node
    var rect = node.append("rect")
        .attr("height", function (d) {
            return d.dy;
        })
        .attr("width", flowchart.node_width())
        .style("fill", get_node_color())
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousedown", mousedown)
        .append("title")
        .text(function (d) {
            return format(d);
        });


    // create links
    var link = svg.append("g").selectAll(".link")
        .data(flowchart.links(), (d) => {
            return d.key + "-" + d.generation + "-" + eval(d.generation + 1)
        });

    link
        .enter().append("path")
        .attr("class", function (d) {
            str = "";
            if (d.op == -1) {
                str = "link link-strong";
            } else {
                str = "link link-normal";
            }
            if (d.ancestor_of) {
                d.ancestor_of.forEach(function (d) {
                    str += " ancestor-of-" + d;
                });
            }

            return str;
        })
        .attr("d", path)
        .style("stroke-width", function (d) {
            return Math.max(1, d.dy);
        })
        .style("stroke", function (d) {
            return link_color(d.op);
        });

    link.exit().remove()
}

function update_visualization(data) {
    // remove all existing elements

    // calculate the node positions
    flowchart.layout();
    let nodes = data ? data.nodes : flowchart.nodes();
    let links = data ? data.links : flowchart.links();
    // create nodes, hence a group for each node
    flowchart.init()


    let removed = svg.selectAll("g").remove()


    var node = svg.append("g").selectAll(".node")
        .data(nodes, function (d) {
            return (d);
        })
        .enter().append("g")
        .attr("class", function (d) {
            str = "node";
            //console.log(d)
            if (d.ancestor_of) {

                d.ancestor_of.forEach(function (d) {
                    str += " ancestor-of-" + d;
                });
            }
            return str;
        })
        .attr("transform", function (d) {
            try {
                if(d.x == NaN){
                    return  "translate(" + Math.random(100) + "," + d.y + ")";
                }
                return "translate(" + d.x + "," + d.y + ")";
            } catch (err) {
                console.error(d)
                return "translate(0,0)"
            }
        });

    // append a rect to each node
    var rect = node.append("rect")
        .attr("height", function (d) {
            return d.dy;
        })
        .attr("width", flowchart.node_width())
        .style("fill", get_node_color())
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousedown", mousedown);
    rect
        .append("title")
        .text(function (d) {
            return format(d);
        });


    // create links
    var link = svg.append("g").selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", function (d) {
            str = "";
            if (d.op == -1) {
                str = "link link-strong";
            } else {
                str = "link link-normal";
            }
            if (d.ancestor_of) {
                d.ancestor_of.forEach(function (d) {
                    str += " ancestor-of-" + d;
                });
            }

            return str;
        })
        .attr("d", path)
        .style("stroke-width", function (d) {
            return Math.max(1, d.dy);
        })
        .style("stroke", function (d) {
            return link_color(d.op);
        });
}

function update_color() {
    var node = svg.selectAll("g.node rect");
    node.style("fill", get_node_color());
}

function change_visualization() {
    $("label > input[name=sort_type]").parent().removeClass("active");
    $("label > input[name=sort_type]:checked").parent().addClass("active");

    $("label > input[name=scale_type]").parent().removeClass("active")
    $("label > input[name=scale_type]:checked").parent().addClass("active")


    flowchart.sort_type($('input[name=sort_type]:checked').val());
    flowchart.scale_type($('input[name=scale_type]:checked').val());
    update_visualization();
}

function change_color() {

    $("label > input[name=color_type]").parent().removeClass("active")
    $("label > input[name=color_type]:checked").parent().addClass("active")

    update_color();
}

function mouseover(d) {
    svg.selectAll("path.link.ancestor-of-" + d.key)
        .classed("link-selected", true);

    svg.selectAll("g.node.ancestor-of-" + d.key + " rect")
        .classed("node-selected", true);
}

function mouseout(d) {
    svg.selectAll("path.link.ancestor-of-" + d.key)
        .classed("link-selected", false);

    svg.selectAll("g.node.ancestor-of-" + d.key + " rect")
        .classed("node-selected", false);
}

function mousedown(d) {
    svg.selectAll("path.link")
        .classed("static-link-selected", false);

    svg.selectAll("g.node rect")
        .classed("static-node-selected", false);

    svg.selectAll("path.link.ancestor-of-" + d.key)
        .classed("static-link-selected", true);

    svg.selectAll("g.node.ancestor-of-" + d.key + " rect")
        .classed("static-node-selected", true);
}


