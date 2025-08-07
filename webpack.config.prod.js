module.exports = {
	mode: "production",
	entry: "./src/main.ts",
	output: {
		path: `${__dirname}/dist`,
		filename: "main.js"
	},
	module: {
		rules: [
		{
			test: /\.ts$/,
			use: "ts-loader"
		}
		]
	},
	resolve: {
		extensions: [".ts", ".js"]
	}
};
