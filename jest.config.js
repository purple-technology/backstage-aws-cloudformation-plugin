module.exports = {
	preset: 'ts-jest',
	moduleFileExtensions: ['js', 'json', 'ts'],
	roots: ['<rootDir>/src'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest'
	},
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.ts'],
	coverageThreshold: {
		global: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100
		}
	},
	testEnvironment: 'node'
}
