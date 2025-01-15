async function area_chart() {

    const data_drought = await d3.csv('data_drought.csv');
    const data_flood = await d3.csv('data_flood.csv');
    const data_extremeTemp = await d3.csv('data_extremeTemp.csv');
    const data_storm = await d3.csv('data_storm.csv');
    const data_wildfire = await d3.csv('data_wildfire.csv');


    const parseDate = d3.timeParse('%Y-%m-%d');
    data_drought.forEach(d => {
        d.Year = parseDate(d.Year);
        d.value = +d.value;
    });

    data_flood.forEach(d => {
        d.Year = parseDate(d.Year);
        d.value = +d.value;
    });

    data_extremeTemp.forEach(d => {
        d.Year = parseDate(d.Year);
        d.value = +d.value;
    });

    data_storm.forEach(d => {
        d.Year = parseDate(d.Year);
        d.value = +d.value;
    });

    data_wildfire.forEach(d => {
        d.Year = parseDate(d.Year);
        d.value = +d.value;
    });

    // 1. Dimensions
    const width = 700;
    const height = width * 0.6;

    const dimensions = {
        width: width,
        height: height,
        margin: {
            top: 50,
            right: 10,
            bottom: 50,
            left: 50,
        },
    };

    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    // 2. Draw canvas
    const wrapper = d3.select('#wrapper')
        .append('svg')
        .attr('width', dimensions.width * 2 + 50) // Adjust width to accommodate both charts
        .attr('height', dimensions.height * 3 + 100); // Adjust height to accommodate all charts

    const defs = wrapper.append('defs');

    // Define the gradients
    const gradients = [
        { id: 'gradient1', color: '#18A8EB33', stroke: '#18A8EB' },
        { id: 'gradient2', color: '#FF573333', stroke: '#FF5733' },
        { id: 'gradient3', color: '#33FF5733', stroke: '#33FF57' },
        { id: 'gradient4', color: '#FF33A833', stroke: '#FF33A8' },
        { id: 'gradient5', color: '#A833FF33', stroke: '#A833FF' }
    ];

    gradients.forEach((gradient, index) => {
        const grad = defs.append('linearGradient')
            .attr('id', gradient.id)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        grad.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', gradient.color)
            .attr('stop-opacity', 1);

        grad.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', gradient.color)
            .attr('stop-opacity', 0.1);
    });

    // Draw the first chart (Drought)
    const bounds1 = wrapper.append('g')
        .style('transform', `translate(${dimensions.margin.left}px, ${dimensions.margin.top + 20}px)`); // Shifted down by 20px

    drawChart(bounds1, data_drought, dimensions, 'Droughts', 'gradient1', gradients[0].stroke);

    // Draw the second chart (Flood)
    const bounds2 = wrapper.append('g')
        .style('transform', `translate(${dimensions.width + dimensions.margin.left + 50}px, ${dimensions.margin.top + 20}px)`); // Shifted right by width + margin

    drawChart(bounds2, data_flood, dimensions, 'Floods', 'gradient2', gradients[1].stroke);

    // Draw the third chart (Extreme Temperature)
    const bounds3 = wrapper.append('g')
        .style('transform', `translate(${dimensions.margin.left}px, ${dimensions.height + dimensions.margin.top + 70}px)`); // Shifted down by height + margin

    drawChart(bounds3, data_extremeTemp, dimensions, 'Extreme Temperature Events', 'gradient3', gradients[2].stroke);

    // Draw the fourth chart (Storm)
    const bounds4 = wrapper.append('g')
        .style('transform', `translate(${dimensions.width + dimensions.margin.left + 50}px, ${dimensions.height + dimensions.margin.top + 70}px)`); // Shifted right by width + margin

    drawChart(bounds4, data_storm, dimensions, 'Storms', 'gradient4', gradients[3].stroke);

    // Draw the fifth chart (Wildfire)
    const bounds5 = wrapper.append('g')
        .style('transform', `translate(${dimensions.margin.left}px, ${(dimensions.height * 2) + dimensions.margin.top + 120}px)`); // Shifted down by 2*height + margin

    drawChart(bounds5, data_wildfire, dimensions, 'Wildfires', 'gradient5', gradients[4].stroke);
}

function drawChart(bounds, data, dimensions, title, gradientId, strokeColor) {
    // 3. Scales
    const xAccessor = d => d.Year;
    const yAccessor = d => d.value;

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => xAccessor(d)))
        .range([0, dimensions.boundedWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => yAccessor(d))])
        .range([dimensions.boundedHeight, 0]);

    // 4. Draw data
    const upperLineGenerator = d3.line()
        .x(d => xScale(xAccessor(d)))
        .y(d => yScale(yAccessor(d)))
        .curve(d3.curveBasis); // Add curve if needed

    const upperPath = upperLineGenerator(data);

    // Combine the upper and lower paths to create the area path
    const areaPath = `${upperPath} L${xScale(xAccessor(data[data.length - 1]))},${yScale(0)} L${xScale(xAccessor(data[0]))},${yScale(0)} Z`;

    bounds.append('path')
        .attr('d', areaPath)
        .attr('fill', `url(#${gradientId})`); // Use the gradient

    bounds.append('path')
        .attr('d', upperLineGenerator(data))
        .attr('stroke', strokeColor)
        .attr('stroke-opacity', 1)
        .attr('stroke-width', '1px')
        .attr('fill', 'none');

    // 4. Draw peripherals
    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)
        .ticks(5)
        .tickSize(0)
        .tickPadding(10);

    const xAxis = bounds.append('g')
        .call(xAxisGenerator)
        .style('transform', `translateY(${dimensions.boundedHeight}px)`)
        .attr('class', 'x-axis');

    xAxis.select('.domain').remove();

    // Add a straight vertical dashed-line above all the labels
    xAxis.selectAll('.tick')
        .append('line')
        .attr('y1', -dimensions.boundedHeight)
        .attr('y2', 0)
        .attr('stroke', '#E5E5DE')
        .attr('stroke-dasharray', '4 4');

    // 5. Add Title
    bounds.append('text')
        .attr('class', 'title')
        .attr('x', -5)
        .attr('y', -30) // Adjusted to be above the chart
        .text(title)
}

area_chart();
