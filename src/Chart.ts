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
    private barMax: number = 0;
    private lineMax: number = 0;

    constructor(idName: string, _width: number, _height: number, margin: { top: number, right: number, bottom: number, left: number }) {
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

    public clear() {
        this.svg.selectAll('*').remove()
    }

    public drawBarAndLine(data: any) {
        const lightColor = '#c1d0e6';
        const accentColor = '#eeff00';

        const svg = this.svg;
        const width = this.width;
        const height = this.height;

        if (data.length == 0) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .attr('text-align', 'center')
                .attr('font-size', `24px`)
                .attr('fill', '#eee')
                .text('no data');
            return;
        }

        let mouseOver = (e: any, d: any) => {
            d3.select('#tooltip')
                .style('top', `${e.pageY}px`)
                .style('left', `${e.pageX}px`)
                .style('display', 'block')
                .html(`<div>${d.dateStr}</div><div>${d.energy.toFixed(2)} kWh</div><div>${d.cost.toFixed(2)} 円</div>`);
        }

        let padding: number = data.length >= 15 ? 0.3 : 0.2;
        this.xScale = d3.scaleBand()
            .range([0, width])
            .domain(data.map((d: any) => d.dateStr))
            .padding(padding);

        let ymax = Number(d3.max(data, (d: any) => +Number(d.energy)));
        if (ymax > this.barMax) this.barMax = ymax;
        let yScale = d3.scaleLinear()
            .domain([0, this.barMax])
            .range([height, 0]);

        let r = data.length < 5 ? 5 : this.xScale.bandwidth() * 0.2;
        svg.selectAll('mybar')
            .data(data)
            .join('rect')
            .attr('x', (d: any) => <any>this.xScale(d.dateStr))
            .attr('y', (d: any) => yScale(d.energy))
            .attr('width', this.xScale.bandwidth())
            .attr('height', (d: any) => height - yScale(d.energy))
            .attr('fill', lightColor)
            .attr('stroke', lightColor)
            .attr('rx', r)
            .attr('ry', r)
            .on('mouseover', (e: any, d: any) => mouseOver(e, d))
            .on('mousemove', (e: any, d: any) => mouseOver(e, d))
            .on('mouseout', (e: any, d: any) => {
                d3.select('#tooltip').style('display', 'none');
            });

        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(5));
        svg.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .attr('text-anchor', 'top')
            .attr('text-align', 'center')
            .attr('font-size', `12px`)
            .attr('fill', '#eee')
            .text('kWh');

        let xAxis = svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(this.xScale));
        xAxis.selectAll('text')
            .attr('transform', `translate(-10, 5)rotate(-60)`)
            .attr('text-anchor', 'end')
            .attr('fill', '#eee');
        // 2week以上の表示はx軸の目盛文字は一個飛ばし
        if (data.length >= 15) {
            xAxis.selectAll('text')._groups[0].forEach((node: any, i: number) => {
                if (i % 2 == 1) {
                    node.remove();
                }
            });
        }

        let ymax2 = Number(d3.max(data, (d: any) => +d.cost));
        if(ymax2 > this.lineMax) this.lineMax = ymax2;
        let yScale2 = d3.scaleLinear()
            .domain([0, this.lineMax * 2])
            .range([height, 0]);
        svg.append('g')
            .attr('transform', `translate(${width}, 0)`)
            .call(d3.axisRight(yScale2));
        svg.append('text')
            .attr('x', width)
            .attr('y', -10)
            .attr('text-anchor', 'end')
            .attr('text-align', 'center')
            .attr('font-size', `12px`)
            .attr('fill', '#eee')
            .text('円');

        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', accentColor)
            .attr('stroke-width', 3)
            .attr('d', d3.line()
                .x((d: any) => <any>this.xScale(d.dateStr) + this.xScale.bandwidth() / 2)
                .y((d: any) => yScale2(d.cost))
            )
            .on('mouseover', (e: any, d: any) => mouseOver(e, d))
            .on('mousemove', (e: any, d: any) => mouseOver(e, d))
            .on('mouseout', (e: any, d: any) => {
                d3.select('#tooltip').style('display', 'none');
            });

        svg.append('g')
            .selectAll('dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', (d: any) => <any>this.xScale(d.dateStr) + this.xScale.bandwidth() / 2)
            .attr('cy', (d: any) => yScale2(d.cost))
            .attr('r', 4.5)
            .style('fill', accentColor)
            .on('mouseover', (e: any, d: any) => mouseOver(e, d))
            .on('mousemove', (e: any, d: any) => mouseOver(e, d))
            .on('mouseout', (e: any, d: any) => {
                d3.select('#tooltip').style('display', 'none');
            });
    }

    // public drawBar(data: any, yaxisTitle: string, color: string) {
    //     const svg = this.svg;
    //     const width = this.width;
    //     const height = this.height;

    //     if (data.length == 0) {
    //         svg.append('text')
    //             .attr('x', width / 2)
    //             .attr('y', height / 2)
    //             .attr('text-anchor', 'middle')
    //             .attr('text-align', 'center')
    //             .attr('font-size', `24px`)
    //             .attr('fill', '#eee')
    //             .text('no data');
    //         return;
    //     }

    //     let padding: number = data.length >= 15 ? 0.3 : 0.2;
    //     console.log(padding)
    //     this.xScale = d3.scaleBand()
    //         .range([0, width])
    //         .domain(data.map((d: any) => d.dateStr))
    //         .padding(padding);

    //     let yScale = d3.scaleLinear()
    //         .domain([0, Number(d3.max(data, (d: any) => +Number(d.value)))])
    //         .range([height, 0]);

    //     let r = data.length < 5 ? 5 : this.xScale.bandwidth() * 0.2;
    //     svg.selectAll('mybar')
    //         .data(data)
    //         .join('rect')
    //         .attr('x', (d: any) => <any>this.xScale(d.dateStr))
    //         .attr('y', (d: any) => yScale(d.value))
    //         .attr('width', this.xScale.bandwidth())
    //         .attr('height', (d: any) => height - yScale(d.value))
    //         .attr('fill', color)
    //         .attr('stroke', color)
    //         .attr('rx', r)
    //         .attr('ry', r)
    //         .on('mouseover', (e: any, d: any) => {
    //             d3.select('#tooltip')
    //                 .style('top', `${e.pageY}px`)
    //                 .style('left', `${e.pageX}px`)
    //                 .style('display', 'block')
    //                 .html(`<div>${d.dateStr}</div><div>${d.value} kWh</div>`);
    //         })
    //         .on('mousemove', (e: any, d: any) => {
    //             d3.select('#tooltip')
    //                 .style('top', `${e.pageY}px`)
    //                 .style('left', `${e.pageX}px`)
    //                 .style('display', 'block')
    //                 .html(`<div>${d.dateStr}</div><div>${d.value} kWh</div>`);
    //         })
    //         .on('mouseout', (e: any, d: any) => {
    //             d3.select('#tooltip').style('display', 'none');
    //         });

    //     svg.append('g')
    //         .call(d3.axisLeft(yScale).ticks(5));
    //     svg.append('text')
    //         .attr('x', 0)
    //         .attr('y', -10)
    //         .attr('text-anchor', 'top')
    //         .attr('text-align', 'center')
    //         .attr('font-size', `12px`)
    //         .attr('fill', '#eee')
    //         .text(yaxisTitle);

    //     let xAxis = svg.append('g')
    //         .attr('transform', `translate(0, ${height})`)
    //         .call(d3.axisBottom(this.xScale));
    //     xAxis.selectAll('text')
    //         .attr('transform', `translate(-10, 5)rotate(-60)`)
    //         .attr('text-anchor', 'end')
    //         .attr('fill', '#eee');
    //     // 2week以上の表示はx軸の目盛文字は一個飛ばし
    //     if (data.length >= 15) {
    //         xAxis.selectAll('text')._groups[0].forEach((node: any, i: number) => {
    //             if (i % 2 == 1) {
    //                 node.remove();
    //             }
    //         });
    //     }
    // }


    // public drawLineSub(data: any, yaxisTitle: string, color: string) {
    //     const svg = this.svg;
    //     const width = this.width;
    //     const height = this.height;

    //     if (data.length == 0) {
    //         return;
    //     }

    //     // Add Y axis
    //     let yScale = d3.scaleLinear()
    //         .domain([0, Number(d3.max(data, (d: any) => +d.value)) * 2])
    //         .range([height, 0]);
    //     svg.append('g')
    //         .attr('transform', `translate(${width}, 0)`)
    //         .call(d3.axisRight(yScale));
    //     svg.append('text')
    //         .attr('x', width)
    //         .attr('y', -10)
    //         .attr('text-anchor', 'end')
    //         .attr('text-align', 'center')
    //         .attr('font-size', `12px`)
    //         .attr('fill', '#eee')
    //         .text(yaxisTitle);

    //     svg.append('path')
    //         .datum(data)
    //         .attr('fill', 'none')
    //         .attr('stroke', color)
    //         .attr('stroke-width', 3)
    //         .attr('d', d3.line()
    //             .x((d: any) => <any>this.xScale(d.dateStr) + this.xScale.bandwidth() / 2)
    //             .y((d: any) => yScale(d.value))
    //         );

    //     svg.append('g')
    //         .selectAll('dot')
    //         .data(data)
    //         .enter()
    //         .append('circle')
    //         .attr('cx', (d: any) => <any>this.xScale(d.dateStr) + this.xScale.bandwidth() / 2)
    //         .attr('cy', (d: any) => yScale(d.value))
    //         .attr('r', 4.5)
    //         .style('fill', color);
    // }

    public drawCalHeatmap(data: any) {
        const lightColor = '#c1d0e6';
        const baseColor = '#1e2a38';

        if (data.length == 0) {
            return;
        }

        data = this.prepareDataForHeatmap(data);
        const svg = this.svg;
        const width = this.width;
        const height = this.height;
        let weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        let x = d3.scaleBand()
            .range([0, width])
            .domain(Array.from(new Set(data.map((d: any) => d.representDate))))
            .padding(0.1);
        svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
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
        svg.append('g')
            .call(d3.axisLeft(y));

        // Build color scale
        let myColor = d3.scaleLinear()
            .range(<any>[baseColor, lightColor])
            .domain([0, Number(d3.max(data, (d: any) => +d.value))])

        svg.selectAll()
            .data(data, (d: any) => d.representDate + ':' + d.weekday)
            .enter()
            .append('rect')
            .attr('x', (d: any) => x(d.representDate))
            .attr('y', (d: any) => y(d.weekday))
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .style('fill', (d: any) => myColor(d.value))
            .attr('rx', 2)
            .attr('ry', 2);
    }

    private prepareDataForHeatmap(data: any[]): any[] {
        let repDate = data[0].dateStr;
        return data.map((d: any) => {
            let weekday = dayjs(d.dateStr).format('ddd');
            if (weekday == 'Mon') {
                repDate = d.dateStr;
            }
            return {
                weekday: weekday,
                representDate: dayjs(repDate).format('MMM-DD'),
                date: d.dateStr,
                value: d.energy
            }
        });
    }
}