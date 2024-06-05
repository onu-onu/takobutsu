export class GraphQLFetcher {
    private ENDPOINT = 'https://api.oejp-kraken.energy/v1/graphql/';

    private fetchWrapper(query: string, variables: Object): Promise<any>;
    private fetchWrapper(query: string, variables: Object, token: string): Promise<any>;
    private fetchWrapper(query: string, variables: Object, token?: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            if (!token)
                token = '';
            try {
                let result = await fetch(this.ENDPOINT, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": String(token)
                    },
                    body: JSON.stringify({
                        query: query,
                        variables: variables
                    }),
                });
                let jsonMsg = await result.json();
                resolve(jsonMsg);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async getToken(email: string, passwd: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `mutation login($input: ObtainJSONWebTokenInput!) {
                    obtainKrakenToken(input: $input) {
                        token
                        refreshToken
                    }
                }`
                const variables = { "input": { "email": email, "password": passwd } };
                const headers = {};
                let result = await this.fetchWrapper(query, variables);
                resolve(result.data.obtainKrakenToken)
            } catch (error) {
                reject(error);
            }
        });
    }

    public async getUsedData(token: string, accountNumber: string, startDate: string, endData: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                query halfHourlyReadings(
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
                    "toDatetime": endData
                };
                let result = await this.fetchWrapper(query, variables, token);
                resolve(result.data.account.properties[0].electricitySupplyPoints[0].halfHourlyReadings);
            } catch (error) {
                reject(error);
            }
        });
    }
}