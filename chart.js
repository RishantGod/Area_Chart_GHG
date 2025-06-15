async function area_chart() {

    const data_flood = await d3.csv('data_flood.csv');
    const data_extremeTemp = await d3.csv('data_extremeTemp.csv');
    const data_storm = await d3.csv('data_storm.csv');
    const data_wildfire = await d3.csv('data_wildfire.csv');

    const parseDate = d3.timeParse('%Y-%m-%d');

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
        .attr('height', dimensions.height * 2 + 100); // Adjust height to accommodate all charts

    const defs = wrapper.append('defs');

    // Define the gradients
    const gradients = [
        { id: 'gradient1', color: '#18A8EB', stroke: '#18A8EB' },
        { id: 'gradient2', color: '#EB1818', stroke: '#EB1818' },
        { id: 'gradient3', color: '#D8510E', stroke: '#D8510E' },
        { id: 'gradient4', color: '#EBC818', stroke: '#EBC818' }
    ];


    gradients.forEach((gradient) => {
        const grad = defs.append('linearGradient')
            .attr('id', gradient.id)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '90%');

        grad.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', gradient.color)
            .attr('stop-opacity', 0.15);

        grad.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', gradient.color)
            .attr('stop-opacity', 0);
    });

    // Draw the first chart (Flood)
    const bounds1 = wrapper.append('g')
        .style('transform', `translate(${dimensions.margin.left}px, ${dimensions.margin.top + 20}px)`); // Shifted down by 20px

    drawChart(bounds1, data_flood, dimensions, 'Floods', 'gradient1', gradients[0].stroke);

    // Draw the second chart (Extreme Temperature)
    const bounds2 = wrapper.append('g')
        .style('transform', `translate(${dimensions.width + dimensions.margin.left + 50}px, ${dimensions.margin.top + 20}px)`); // Shifted right by width + margin

    drawChart(bounds2, data_extremeTemp, dimensions, 'Extreme Temperature Events', 'gradient2', gradients[1].stroke);

    // Draw the third chart (Storm)
    const bounds3 = wrapper.append('g')
        .style('transform', `translate(${dimensions.margin.left}px, ${dimensions.height + dimensions.margin.top + 70}px)`); // Shifted down by height + margin

    drawChart(bounds3, data_storm, dimensions, 'Storms', 'gradient3', gradients[2].stroke);

    // Draw the fourth chart (Wildfire)
    const bounds4 = wrapper.append('g')
        .style('transform', `translate(${dimensions.width + dimensions.margin.left + 50}px, ${dimensions.height + dimensions.margin.top + 70}px)`); // Shifted right by width + margin

    drawChart(bounds4, data_wildfire, dimensions, 'Wildfires', 'gradient4', gradients[3].stroke);
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
        .curve(d3.curveCardinal.tension(0.5)); 

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
        .attr('stroke-width', '1.5px')
        .attr('fill', 'none');

    // 4. Draw peripherals
    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)
        .ticks(5)
        .tickSize(0)
        .tickPadding(15);

    const xAxis = bounds.append('g')
        .call(xAxisGenerator)
        .style('transform', `translateY(${dimensions.boundedHeight}px)`)
        .attr('class', 'x-axis');

    xAxis.select('.domain').remove();

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
        .attr('y', -30)
        .text(title);

    // 6. Create tooltip (reused across events)
    const tooltip = bounds.append('g')
        .style('pointer-events', 'none')
        .style('opacity', 0);

    const tooltipCircle = tooltip.append('circle')
        .attr('r', 4)
        .attr('fill', 'white')
        .attr('stroke', strokeColor);

    const tooltipText = tooltip.append('text')
        .attr('x', 0)
        .attr('y', -20)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-family', 'sans-serif');

    // 7. Add mouse interaction using direct data-to-coordinate mapping
    bounds.append('rect')
        .attr('width', dimensions.boundedWidth)
        .attr('height', dimensions.boundedHeight)
        .style('opacity', 0)
        .on('mousemove', function(event) {
            // Use d3.pointer with the current rect as container for proper coordinates.
            const [mouseX] = d3.pointer(event, this);
            
            // Convert mouseX to a corresponding date using xScale
            const hoveredDate = xScale.invert(mouseX);
            
            // Use bisector to find closest index
            const bisect = d3.bisector(xAccessor).left;
            const closestIndex = bisect(data, hoveredDate);
            const closestDataPoint = data[closestIndex];

            // Directly calculate the tooltip position based on the scales
            const tooltipX = xScale(xAccessor(closestDataPoint));
            const tooltipY = yScale(yAccessor(closestDataPoint));

            tooltip.style('opacity', 1)
                .style('transform', `translate(${tooltipX}px, ${tooltipY}px)`);

            tooltipText.text(yAccessor(closestDataPoint));
        })
        .on('mouseleave', () => {
            tooltip.style('opacity', 0);
        });
}

area_chart();
