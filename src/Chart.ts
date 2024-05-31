import * as d3 from 'd3';


export class Chart {
    private svg: any;
    private width: number;
    private height: number;

    constructor(idName: string, _width: number, _height: number) {
        // set the dimensions and margins of the graph
        var margin = { top: 50, right: 50, bottom: 100, left: 50 };
        this.width = _width - margin.left - margin.right;
        this.height = _height - margin.top - margin.bottom;

        // append the svg object to the body of the page
        this.svg = d3.select(idName)
            .append('svg')
            .attr('width', this.width + margin.left + margin.right)
            .attr('height', this.height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
    }


    public drawBar(data: any, yaxisTitle: string) {
        const svg = this.svg;
        const width = this.width;
        const height = this.height;

        // Add X axis --> it is a date format
        const xScale = d3.scaleBand()
            .range([0, width])
            .domain(data.map((d: any) => d.dateStr))
            .padding(0.2);
        let xAxis = svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));
        xAxis.selectAll('text')
            .attr('transform', 'rotate(-60)')
            .attr('text-anchor', 'end');

        // Add Y axis
        var yScale = d3.scaleLinear()
            .domain([0, Number(d3.max(data, (d: any) => +d.value))])
            .range([height, 0]);
        svg.append('g')
            .call(d3.axisLeft(yScale));
        svg.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .attr('text-anchor', 'top')
            .attr('text-align', 'center')
            .attr('font-size', `12px`)
            // .attr('font-family', 'Arial')
            // .attr('font-weight', 'nomal')
            .text(yaxisTitle);

        svg.selectAll('mybar')
            .data(data)
            .join('rect')
            .attr('x', (d: any) => <any>xScale(d.dateStr))
            .attr('y', (d: any) => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', (d: any) => height - yScale(d.value))
            .attr('fill', '#d5e1f7')
            .attr('stroke', '#3477eb');
    }


    public drawLineSub(data: any, yaxisTitle: string) {
        const svg = this.svg;
        const width = this.width;
        const height = this.height;

        // Add X axis --> it is a date format
        const xScale = d3.scaleTime()
            .range([0, width])
            .domain(<any>d3.extent(data, (d:any) => d.date));

        // Add Y axis
        var yScale = d3.scaleLinear()
            .domain([0, Number(d3.max(data, (d: any) => +d.value))])
            .range([height, 0]);
        svg.append('g')
            .attr('transform', `translate(${width}, 0)`)
            .call(d3.axisRight(yScale));
        svg.append('text')
            .attr('x', width)
            .attr('y', -10)
            .attr('text-anchor', 'end')
            .attr('text-align', 'center')
            .attr('font-size', `12px`)
            // .attr('font-family', 'Arial')
            // .attr('font-weight', 'nomal')
            .text(yaxisTitle);


        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr('stroke', '#3477eb')
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x((d: any) => <any>xScale(d.date))
                .y((d: any) => yScale(d.value))
            );
    }
}