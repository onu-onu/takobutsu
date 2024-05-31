import { Chart } from "./Chart";
import { GraphQLFetcher } from "./GraphQLFetcher";

import dayjs from 'dayjs'
// UTCを使うためのおまじない
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)
// タイムゾーンを使うためのおまじない
import timezone from "dayjs/plugin/timezone"
dayjs.extend(timezone)

window.onload = () => {
    const submitBtn: HTMLInputElement = <HTMLInputElement>document.querySelector('#submit');
    const emailTexarea: HTMLInputElement = <HTMLInputElement>document.querySelector('#email');
    const passTexarea: HTMLInputElement = <HTMLInputElement>document.querySelector('#pass');
    const userIdTexarea: HTMLInputElement = <HTMLInputElement>document.querySelector('#user_id');

    submitBtn.addEventListener('click', async () => {
        const loadingMsgBox: HTMLElement = <HTMLElement>document.querySelector('#loading_msg');
        const graphqlClient = new GraphQLFetcher();
        try {
            loadingMsgBox.style.display = 'block';
            
            const token = await graphqlClient.getToken(String(emailTexarea.value), String(passTexarea.value));
            const chart = new Chart();

            let dataSet: any[] = [];
            let today = dayjs();
            for (let i = 0; i < 12; i++) {
                let lastMonth = today.startOf('month').subtract(i, "month");
                let startDate = lastMonth.startOf('month').format('YYYY-MM-DDTHH:mm:ssZ[Z]');
                let endDate = lastMonth.endOf('month').format('YYYY-MM-DDTHH:mm:ssZ[Z]');
                console.log(startDate, endDate)
                let data = await graphqlClient.getUsedData(token.token,
                    String(userIdTexarea.value),
                    startDate,
                    endDate);
                if (data.length > 0) {
                    let preparedData = chart.prepareData(data);
                    dataSet.push(preparedData);
                }
            }
            chart.draw(dataSet);
        } catch (error) {
            alert('There is an error in the information you entered.');
        } finally {
            loadingMsgBox.style.display = 'none';
        }
    });
}

