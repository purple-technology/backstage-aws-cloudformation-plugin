module.exports = {
	globals: {
		__DEV__: true,
		'ts-jest': {
			tsconfig: 'tsconfig.test.json'
		}
	},
	preset: 'ts-jest',
	moduleFileExtensions: ['js', 'json', 'ts'],
	roots: ['<rootDir>/src'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest'
	},
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.ts', '!src/**/index.ts', '!src/testing/**/*.ts'],
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
