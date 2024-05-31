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

    submitBtn.addEventListener('click', async () => {
        const loadingMsgBox: HTMLElement = <HTMLElement>document.querySelector('#loading_msg');
        const chartPane: HTMLElement = <HTMLElement>document.querySelector('#chart_pane');
        const graphqlClient = new GraphQLFetcher();
        const dataFormatter = new DataFromatter();


        try {
            loadingMsgBox.style.display = 'block';

            const token = await graphqlClient.getToken(String(emailTexarea.value), String(passTexarea.value));

            let dailyEeData: any[] = [];
            let monthlyCostData: any[] = [];
            let today = dayjs();
            for (let i = 0; i < 12; i++) {
                let lastMonth = today.startOf('month').subtract(i, 'month');
                let startDate = lastMonth.startOf('month').format('YYYY-MM-DDTHH:mm:ssZ[Z]');
                let endDate = lastMonth.endOf('month').format('YYYY-MM-DDTHH:mm:ssZ[Z]');

                let data = await graphqlClient.getUsedData(token.token,
                    String(userIdTexarea.value),
                    startDate,
                    endDate);
                console.log(data)
                let dailyData = dataFormatter.dailyElectricEnergyData(data);
                dailyEeData = dailyData.concat(dailyEeData);

                let monthlyEeData = dataFormatter.monthlyElectricEnergyData(data);
                let costData = dataFormatter.costData(monthlyEeData);
                monthlyCostData = costData.concat(monthlyCostData)
            }

            const chart0 = new Chart('#month_chart', 600, 400);
            const chart1 = new Chart('#year_chart', 600, 600);
            chart0.drawBar(dailyEeData, 'kWh');
            chart1.drawBar(monthlyCostData, 'Cost (Yen)');
            chartPane.style.display = 'block';
        } catch (error) {
            alert('There is an error in the information you entered.');
        } finally {
            loadingMsgBox.style.display = 'none';
        }
    });
    sample();
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

            const chart0 = new Chart('#month_chart', 600, 400);
            const chart1 = new Chart('#year_chart', 600, 600);
            chart0.drawBar(dailyData, 'kWh');
            chart1.drawBar(monthlyData, 'kWh');
            chart1.drawLineSub(costData, 'Cost (Yen)');

            const chartPane: HTMLElement = <HTMLElement>document.querySelector('#chart_pane');
            chartPane.style.display = 'block';
        });
}