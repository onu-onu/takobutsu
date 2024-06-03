import * as d3 from 'd3';
import chroma from 'chroma-js';
import dayjs from 'dayjs';
// UTCを使うためのおまじない
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
// タイムゾーンを使うためのおまじない
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

export class Chart {
    private svg: any;
    private width: number;
    private height: number;
    private xScale: any = null;

    constructor(idName: string, _width: number, _height: number) {
        let margin = { top: 20, right: 50, bottom: 60, left: 50 };
        this.width = _width - margin.left - margin.right;
        this.height = _height - margin.top - margin.bottom;

        d3.select(idName).selectChild().remove();
        this.svg = d3.select(idName)
            .append('svg')
            .attr('width', this.width + margin.left + margin.right)
            .attr('height', this.height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
    }


    public drawBar(data: any, yaxisTitle: string, color: string) {
        const svg = this.svg;
        const width = this.width;
        const height = this.height;

        this.xScale = d3.scaleBand()
            .range([0, width])
            .domain(data.map((d: any) => d.dateStr))
            .padding(0.2);

        let yScale = d3.scaleLinear()
            .domain([0, Number(d3.max(data, (d: any) => +d.value))])
            .range([height, 0]);

        svg.selectAll('mybar')
            .data(data)
            .join('rect')
            .attr('x', (d: any) => <any>this.xScale(d.dateStr))
            .attr('y', (d: any) => yScale(d.value))
            .attr('width', this.xScale.bandwidth())
            .attr('height', (d: any) => height - yScale(d.value))
            .attr('fill', color)
            .attr('stroke', color)
            .attr('rx', 5)
            .attr('ry', 5);

        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(10));
        svg.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .attr('text-anchor', 'top')
            .attr('text-align', 'center')
            .attr('font-size', `12px`)
            .style('color', '#eee')
            .text(yaxisTitle);

        let xAxis = svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(this.xScale));
        xAxis.selectAll('text')
            .attr('transform', 'rotate(-60)')
            .attr('text-anchor', 'end');

        svg.selectAll('text').style('color', '#eee');
    }


    public drawLineSub(data: any, yaxisTitle: string, color: string) {
        const svg = this.svg;
        const width = this.width;
        const height = this.height;

        // Add Y axis
        let yScale = d3.scaleLinear()
            .domain([0, Number(d3.max(data, (d: any) => +d.value)) * 2])
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
            .style('color', '#eee')
            .text(yaxisTitle);


        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr('stroke', color)
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                .x((d: any) => <any>this.xScale(d.dateStr) + this.xScale.bandwidth() / 2)
                .y((d: any) => yScale(d.value))
            );
        svg.append('g')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", (d: any) => <any>this.xScale(d.dateStr) + this.xScale.bandwidth() / 2)
            .attr("cy", (d: any) => yScale(d.value))
            .attr("r", 5)
            .style("fill", color);

        svg.selectAll('text').style('color', '#eee');
    }

    public drawCalHeatmap(data: any, color0: string, color1: string) {
        data = this.prepareDataForHeatmap(data);
        const svg = this.svg;
        const width = this.width;
        const height = this.height;

        let weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        let x = d3.scaleBand()
            .range([0, width])
            .domain(Array.from(new Set(data.map((d: any) => d.representDate))))
            .padding(0.1);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr('id', 'heatmap_xaxis')
            .call(d3.axisBottom(x).tickFormat((d: any) => d.split('-')[0]));

        let monthChecks: string[] = []
        document.querySelectorAll('#heatmap_xaxis text')
            .forEach((text: any) => {
                let month = text.textContent
                if (!monthChecks.includes(month)) {
                    monthChecks.push(month);
                } else {
                    text.remove();
                }
            });

        // Build X scales and axis:
        let y = d3.scaleBand()
            .range([0, height])
            .domain(weekday)
            .padding(0.2);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Build color scale
        let myColor = d3.scaleLinear()
            .range(<any>[color1, color0])
            .domain([0, Number(d3.max(data, (d: any) => +d.value))])

        svg.selectAll()
            .data(data, (d: any) => d.representDate + ':' + d.weekday)
            .enter()
            .append("rect")
            .attr("x", (d: any) => x(d.representDate))
            .attr("y", (d: any) => y(d.weekday))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", (d: any) => myColor(d.value))
            .attr('rx', 5)
            .attr('ry', 5);
    }

    private prepareDataForHeatmap(data: any[]): any[] {
        let repDate = data[0].dateStr;
        return data.map((d: any) => {
            let weekday = dayjs(d.dateStr).format("ddd");
            if (weekday == 'Mon') {
                repDate = d.dateStr;
            }
            return {
                weekday: weekday,
                representDate: dayjs(repDate).format('MMM-DD'),
                date: d.dateStr,
                value: d.value
            }
        });
    }
}