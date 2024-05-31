import * as d3 from 'd3';
import dayjs from 'dayjs'
// UTCを使うためのおまじない
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)
// タイムゾーンを使うためのおまじない
import timezone from "dayjs/plugin/timezone"
dayjs.extend(timezone)

export class Chart {

    public prepareData(rawData: any[]): any {
        let tmp: any = {}
        rawData.forEach(d => {
            let day: string = dayjs(d.startAt)
                                .tz('Asia/Tokyo')
                                .format('YYYY-MM-DD');
            if (day in tmp) {
                tmp[day] += Number(d.value);
            } else {
                tmp[day] = Number(d.value);
            }
        });
        return Object.keys(tmp).map((day: string) => {
            return {
                date: d3.timeParse("%Y-%m-%d")(day),
                day: Number(day.split('-')[2]),
                value: tmp[day]
            };
        });
    }

    public draw(dataSet: any) {
        // set the dimensions and margins of the graph
        var margin = { top: 50, right: 20, bottom: 50, left: 30 },
            width = 600 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Add X axis --> it is a date format
        var x = d3.scaleLinear()
            .domain([0, 31])
            .range([0, width]);
        let xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));
        // xAxis.selectAll('text')
        //     .attr('transform', 'rotate(-60)')
        //     .attr("text-anchor", "end")
        svg.append('text')
            .attr("x", width - 5)
            .attr("y", height + 30)
            .attr("text-anchor", "top")
            .attr("text-align", "center")
            .attr("font-size", `12px`)
            // .attr("font-family", 'Arial')
            // .attr("font-weight", 'nomal')
            .text('day');
        
        const xBar = d3.scaleBand()
            .range([0, width ])
            .domain(Array.from(new Array(31), (x, i) => String(i + 1) ))
            .padding(0.2);

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, Number(d3.max(dataSet.flat(), (d: any) => +d.value))])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));
        svg.append('text')
            .attr("x", 0)
            .attr("y", -10)
            .attr("text-anchor", "top")
            .attr("text-align", "center")
            .attr("font-size", `12px`)
            // .attr("font-family", 'Arial')
            // .attr("font-weight", 'nomal')
            .text('kWh')

        dataSet.forEach((data: any, i: number) => {
            // Add the area
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "#69b3a2")
                .attr('opacity', 1 - i / dataSet.length)
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x((d: any) => x(d.day))
                    .y((d: any) => y(d.value))
                );
            // Add dots
            svg.append('g')
                .selectAll("dot")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", (d: any) => x(d.day))
                .attr("cy", (d: any) => y(d.value))
                .attr("r", 2)
                .style("fill", "#69b3a2")
                .attr('opacity', 1 - i / dataSet.length);

            svg.selectAll("mybar")
                .data(data)
                .join("rect")
                  .attr("x", (d: any) => <any>xBar(String(d.day)))
                  .attr("y", (d: any) => y(d.value))
                  .attr("width", xBar.bandwidth())
                  .attr("height", (d: any) => height - y(d.value))
                  .attr("fill", "#69b3a2")
        });
    }
}