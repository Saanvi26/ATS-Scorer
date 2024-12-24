# ATS Score Application

[![Build Status](https://img.shields.io/travis/username/ats-score/main.svg)](https://travis-ci.org/username/ats-score)
[![Version](https://img.shields.io/npm/v/ats-score.svg)](https://www.npmjs.com/package/ats-score)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A powerful application designed to analyze resumes and calculate ATS (Applicant Tracking System) compatibility scores. This tool helps job seekers optimize their resumes for better visibility and higher success rates with automated recruitment systems.

## Features

- **Resume Analysis**
  - PDF document support
  - Keyword extraction and analysis
  - Format compatibility checking

- **Job Description Matching**
  - Intelligent keyword matching
  - Skills alignment analysis
  - Experience level compatibility

- **Score Calculation**
  - Weighted scoring algorithm
  - Detailed scoring breakdown
  - Improvement suggestions

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/username/ats-score.git

# Navigate to project directory
cd ats-score

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
nano .env  # or use your preferred editor

## Environment Variables

The application requires proper environment variable configuration to function correctly:

1. Create a `.env` file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Configure the required environment variables in your `.env` file:
   - All browser-exposed variables must be prefixed with `VITE_`
   - This is a Vite.js requirement for security purposes

3. Set up your OpenAI API key:
   ```env
   VITE_OPENAI_API_KEY=your_api_key_here
   ```

You can see an example of environment variable usage in `src/services/openai.js`, which uses the OpenAI API key for resume analysis.

## Usage Guide

### Starting the Application

```bash
npm run dev
```

### Using the Score Feature

1. Upload your resume (PDF)
2. Input or paste the job description
3. Click "Calculate Score"
4. Review detailed analysis and suggestions

## Technologies

- React 18
- Vite
- TypeScript
- Tailwind CSS
- PDF.js
- Natural Language Processing libraries

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code

## Contributing

### Guidelines

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request

### Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct. Please read it before contributing.

### Pull Request Process

1. Update documentation
2. Update CHANGELOG.md
3. Get approval from maintainers
4. Merge after CI passes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact & Support

- **Issues**: Please report bugs via [GitHub Issues](https://github.com/username/ats-score/issues)
- **Email**: support@ats-score.com
- **Twitter**: [@ATSScore](https://twitter.com/ATSScore)

---

Made with ❤️ by the ATS Score Team# ATS-Scorer-
