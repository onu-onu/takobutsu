import { Chart } from './Chart';
import { GraphQLFetcher } from './GraphQLFetcher';
import { DataFromatter } from './DataFromatter';

import dayjs from 'dayjs'
// UTCを使うためのおまじない
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
// タイムゾーンを使うためのおまじない
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(timezone)

const baseColor = '#1e2a38';
const lightColor = '#c1d0e6';
const accentColor = '#eeff00';

window.onload = () => {
    const submitBtn: HTMLInputElement = <HTMLInputElement>document.querySelector('#submit');
    const emailTexarea: HTMLInputElement = <HTMLInputElement>document.querySelector('#email');
    const passTexarea: HTMLInputElement = <HTMLInputElement>document.querySelector('#pass');
    const userIdTexarea: HTMLInputElement = <HTMLInputElement>document.querySelector('#user_id');

    const body: HTMLElement = <HTMLElement>document.querySelector('body');
    const loginPane: HTMLElement = <HTMLElement>document.querySelector('#login_pane');

    controller();

    // loginPane.style.display = 'none';
    // sample(body.clientWidth);
    // return;
    const maxChartW = 600;
    let chartW = body.clientWidth < maxChartW ? body.clientWidth : maxChartW;
    let chartH = body.clientHeight - 300 < chartW ? body.clientHeight : chartW;

    let params: any = {}
    location.search.replace('?', '').split('&').forEach(param => {
        let token = param.split('=');
        let key = token[0];
        let value = token[1];
        params[key] = String(value);
    });
    if (Object.keys(params).length == 3) {
        loginPane.style.display = 'none';
        drawChart(params.mail, params.pass, params.id, chartW, chartH);
        emailTexarea.value = params.mail;
        passTexarea.value = params.pass;
        userIdTexarea.value = params.id;
    }

    submitBtn.addEventListener('click', async () => {
        loginPane.style.display = 'none';
        drawChart(String(emailTexarea.value), String(passTexarea.value), String(userIdTexarea.value), chartW, chartH);
    });

}

async function drawChart(email: string, pass: string, id: string, width: number, height: number) {
    const loadingMsgBox: HTMLElement = <HTMLElement>document.querySelector('#loading_msg');
    const chartPane: HTMLElement = <HTMLElement>document.querySelector('#chart_pane');
    const graphqlClient = new GraphQLFetcher();
    const dataFormatter = new DataFromatter();
    try {
        loadingMsgBox.style.display = 'block';

        const token = await graphqlClient.getToken(email, pass);


        let today = dayjs();
        let dailyEeData: any[] = [];
        let dailyCtCostData: any[] = [];
        let monthlyEeData: any[] = [];
        let monthlyCostData: any[] = [];
        for (let i = 0; i < 12; i++) {
            let lastMonth = today.startOf('month').subtract(i, 'month');
            let startDate = lastMonth.startOf('month').format('YYYY-MM-DDTHH:mm:ssZ[Z]');
            let endDate = lastMonth.endOf('month').format('YYYY-MM-DDTHH:mm:ssZ[Z]');

            let data = await graphqlClient.getUsedData(token.token, id, startDate, endDate);

            let dailyEe = dataFormatter.dailyElectricEnergyData(data);
            dailyEeData = dailyEe.concat(dailyEeData);
            let dailyCtCost = dataFormatter.dailyCumulativeTotalEstimateCostData(data);
            dailyCtCostData = dailyCtCost.concat(dailyCtCostData);

            let monthlyEe = dataFormatter.monthlyElectricEnergyData(data);
            monthlyEeData = monthlyEe.concat(monthlyEeData);
            let monthlyCost = dataFormatter.costData(monthlyEe);
            monthlyCostData = monthlyCost.concat(monthlyCostData);
        }

        const chart0 = new Chart('#month_chart', width, height);
        let thisMonthStartDate = today.startOf('month').format('YYYY-MM-DD HH:mm:ss');
        let thisMonthEndDate = today.endOf('month').format('YYYY-MM-DD HH:mm:ss');
        let thisMoththDailyEeData = dataFormatter.slice(dailyEeData, thisMonthStartDate, thisMonthEndDate);
        let thisMoththDailyCostData = dataFormatter.slice(dailyEeData, thisMonthStartDate, thisMonthEndDate);
        chart0.drawBar(thisMoththDailyEeData, 'kWh', lightColor);
        chart0.drawLineSub(thisMoththDailyCostData, 'cost(yen)', accentColor);

        const chart2 = new Chart('#last_month_chart', width, height);
        let lastMonth = today.subtract(1, 'month');
        let lastMonthStartDate = lastMonth.startOf('month').format('YYYY-MM-DD HH:mm:ss');
        let lastMonthEndDate = lastMonth.endOf('month').format('YYYY-MM-DD HH:mm:ss');
        let lastMoththDailyEeData = dataFormatter.slice(dailyEeData, lastMonthStartDate, lastMonthEndDate);
        let lastMoththDailyCostData = dataFormatter.slice(dailyEeData, lastMonthStartDate, lastMonthEndDate);
        chart2.drawBar(lastMoththDailyEeData, 'kWh', lightColor);
        chart2.drawLineSub(lastMoththDailyCostData, 'cost(yen)', accentColor);

        const chart1 = new Chart('#year_chart', width, height * 2 / 3);
        console.log(monthlyEeData)
        console.log(monthlyCostData)
        chart1.drawBar(monthlyEeData, 'kWh', lightColor);
        chart1.drawLineSub(monthlyCostData, 'cost(yen)', accentColor);
        chartPane.style.display = 'block';

        const chart3 = new Chart('#heatmap', width, height / 3);
        chart3.drawCalHeatmap(dailyEeData, lightColor, baseColor);
        loadingMsgBox.style.display = 'none';
    } catch (error) {
        alert('データ取得に失敗しました');
        const loginPane: HTMLElement = <HTMLElement>document.querySelector('#login_pane');
        loginPane.style.display = 'block';
        loadingMsgBox.style.display = 'none';
    } finally {
    }
}

function controller() {
    let radio_btns = document.querySelectorAll<HTMLInputElement>(`input[type='radio'][name='chart_select']`);

    const seitchVisChart = () => {
        radio_btns.forEach((target: HTMLInputElement) => {
            let chartId = String(target.id).replace('_slct', '');
            let chart = <HTMLElement>document.querySelector(`#${chartId}`);
            if (target.checked) {
                chart.style.display = 'block';
            } else {
                chart.style.display = 'none';
            }
        });
    }

    radio_btns.forEach((target: HTMLInputElement) => {
        target.addEventListener('change', () => seitchVisChart());
    });
}


function sample(w: number) {
    fetch('../tool/sample_data.json')
        .then(res => res.json())
        .then(data => {
            const dataFormatter = new DataFromatter();
            let dailyData = dataFormatter.dailyElectricEnergyData(data);
            let thisMDailyData = dataFormatter.slice(dailyData, '2024-01-01 00:00:00', '2024-1-31 23:59:59');
            let monthlyData = dataFormatter.monthlyElectricEnergyData(data);
            let costData = dataFormatter.costData(monthlyData);
            let dailyCumulativeTotalCostData = dataFormatter.dailyCumulativeTotalEstimateCostData(data);

            const chart0 = new Chart('#month_chart', w, 400);
            const chart1 = new Chart('#year_chart', w, 600);
            chart0.drawBar(thisMDailyData, 'kWh', accentColor);
            chart0.drawLineSub(dailyCumulativeTotalCostData, 'Cost (Yen)', accentColor);
            chart1.drawBar(monthlyData, 'kWh', accentColor);
            chart1.drawLineSub(costData, 'Cost (Yen)', accentColor);

            const chart3 = new Chart('#heatmap', w, 300);
            chart3.drawCalHeatmap(dailyData, lightColor, baseColor);

            const chartPane: HTMLElement = <HTMLElement>document.querySelector('#chart_pane');
            chartPane.style.display = 'block';
        });
}