import { Logging } from "./Logging";
const logging: Logging = new Logging();

export class GraphQLFetcher {
    private ENDPOINT = 'https://api.oejp-kraken.energy/v1/graphql/';

    private fetchWrapper(query: string, variables: Object): Promise<any>;
    private fetchWrapper(query: string, variables: Object, token: string): Promise<any>;
    private fetchWrapper(query: string, variables: Object, token?: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            if (!token) {
                token = '';
            }
            let fetchStr = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": String(token)
                },
                body: JSON.stringify({
                    query: query,
                    variables: variables
                }),
            }
            try {
                let result = await fetch(this.ENDPOINT, fetchStr);
                logging.debug('query:', query);
                logging.debug('variables:', variables);
                logging.debug('token:', token);

                let jsonMsg = await result.json();
                resolve(jsonMsg);
            } catch (error) {
                logging.error(fetchStr);
                reject(`fetch():${error}`);
            }
        });
    }

    public async getToken(email: string, passwd: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            logging.debug('start get token()');
            try {
                const query = `mutation login($input: ObtainJSONWebTokenInput!) {
                    obtainKrakenToken(input: $input) {
                        token
                        refreshToken
                    }
                }`;
                const variables = { "input": { "email": email, "password": passwd } };
                const headers = {};
                let result = await this.fetchWrapper(query, variables);
                resolve(result.data.obtainKrakenToken)
            } catch (error) {
                reject(`getToken():${error}`);
            }
        });
    }

    public async getUsedData(token: string, accountNumber: string, startDate: string, endDate: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            logging.debug('start getUseData()');
            logging.debug(startDate);
            logging.debug(endDate);
            startDate = startDate.split('+')[0] + 'Z';
            endDate = endDate.split('+')[0] + 'Z';
            try {
                const query = `query halfHourlyReadings(
                    $accountNumber: String!
                    $fromDatetime: DateTime
                    $toDatetime: DateTime
                ) {
                    account(accountNumber: $accountNumber) {
                        properties {
                            electricitySupplyPoints {
                                status
                                agreements {
                                    validFrom
                                }
                                halfHourlyReadings(
                                    fromDatetime: $fromDatetime
                                    toDatetime: $toDatetime
                                ) {
                                    startAt
                                    value
                                    costEstimate
                                }
                            }
                        }
                    }
                }`
                // クエリで(startAtと同列) consumptionStep,consumptionRateBand を指定可能
                const variables = {
                    "accountNumber": accountNumber,
                    "fromDatetime": startDate,
                    "toDatetime": endDate
                };
                let result = await this.fetchWrapper(query, variables, token);
                logging.debug('result', result);
                if ('errors' in result) {
                    resolve(null);
                } else {
                    resolve(result.data.account.properties[0].electricitySupplyPoints[0].halfHourlyReadings);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}