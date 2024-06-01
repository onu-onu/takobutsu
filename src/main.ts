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

window.onload = () => {
    const submitBtn: HTMLInputElement = <HTMLInputElement>document.querySelector('#submit');
    const emailTexarea: HTMLInputElement = <HTMLInputElement>document.querySelector('#email');
    const passTexarea: HTMLInputElement = <HTMLInputElement>document.querySelector('#pass');
    const userIdTexarea: HTMLInputElement = <HTMLInputElement>document.querySelector('#user_id');


    let params: any = {}
    location.search.replace('?', '').split('&').forEach(param => {
        let token = param.split('=');
        let key = token[0];
        let value = token[1];
        params[key] = String(value);
    });
    if (Object.keys(params).length == 3) {
        drawChart(params.mail, params.pass, params.id);
        emailTexarea.value = params.mail;
        passTexarea.value = params.pass;
        userIdTexarea.value = params.id;
    }

    submitBtn.addEventListener('click', async () => {
        drawChart(String(emailTexarea.value), String(passTexarea.value), String(userIdTexarea.value));
    });
    // sample();
}

async function drawChart(email: string, pass: string, id: string) {
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

        const chart0 = new Chart('#month_chart', 600, 400);
        let thisMonthStartDate = today.startOf('month').format('YYYY-MM-DD HH:mm:ss');
        let thisMonthEndDate = today.endOf('month').format('YYYY-MM-DD HH:mm:ss');
        let thisMoththDailyEeData = dataFormatter.slice(dailyEeData, thisMonthStartDate, thisMonthEndDate);
        let thisMoththDailyCostData = dataFormatter.slice(dailyEeData, thisMonthStartDate, thisMonthEndDate);
        chart0.drawBar(thisMoththDailyEeData, 'kWh', '#3477eb');
        chart0.drawLineSub(thisMoththDailyCostData, 'cost(yen)', '#eeff00');

        const chart2 = new Chart('#last_month_chart', 600, 400);
        let lastMonth = today.subtract(1, 'month');
        let lastMonthStartDate = lastMonth.startOf('month').format('YYYY-MM-DD HH:mm:ss');
        let lastMonthEndDate = lastMonth.endOf('month').format('YYYY-MM-DD HH:mm:ss');
        let lastMoththDailyEeData = dataFormatter.slice(dailyEeData, lastMonthStartDate, lastMonthEndDate);
        let lastMoththDailyCostData = dataFormatter.slice(dailyEeData, lastMonthStartDate, lastMonthEndDate);
        chart2.drawBar(lastMoththDailyEeData, 'kWh', '#3477eb');
        chart2.drawLineSub(lastMoththDailyCostData, 'cost(yen)', '#eeff00');

        const chart1 = new Chart('#year_chart', 600, 600);
        console.log(monthlyEeData)
        console.log(monthlyCostData)
        chart1.drawBar(monthlyEeData, 'kWh', '#3477eb');
        chart1.drawLineSub(monthlyCostData, 'cost(yen)', '#eeff00');
        chartPane.style.display = 'block';
    } catch (error) {
        alert('There is an error in the information you entered.');
    } finally {
        loadingMsgBox.style.display = 'none';
    }
}

function sample() {
    fetch('../tool/sample_data.json')
        .then(res => res.json())
        .then(data => {
            const dataFormatter = new DataFromatter();
            let dailyData = dataFormatter.dailyElectricEnergyData(data);
            dailyData = dataFormatter.slice(dailyData, '2024-01-01 00:00:00', '2024-1-31 23:59:59');
            let monthlyData = dataFormatter.monthlyElectricEnergyData(data);
            let costData = dataFormatter.costData(monthlyData);
            let dailyCumulativeTotalCostData = dataFormatter.dailyCumulativeTotalEstimateCostData(data);
            console.log(dailyCumulativeTotalCostData)
            const chart0 = new Chart('#month_chart', 600, 400);
            const chart1 = new Chart('#year_chart', 600, 600);
            chart0.drawBar(dailyData, 'kWh', '#3477eb');
            chart0.drawLineSub(dailyCumulativeTotalCostData, 'Cost (Yen)', '#3477eb');
            chart1.drawBar(monthlyData, 'kWh', '#3477eb');
            chart1.drawLineSub(costData, 'Cost (Yen)', '#3477eb');

            const chartPane: HTMLElement = <HTMLElement>document.querySelector('#chart_pane');
            chartPane.style.display = 'block';
        });
}