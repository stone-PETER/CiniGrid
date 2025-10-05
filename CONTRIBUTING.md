# Contributing to CiniGrid

We love your input! We want to make contributing to CiniGrid as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests Process

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Branch Naming Convention

- `feature/feature-name` - for new features
- `bugfix/issue-description` - for bug fixes
- `hotfix/critical-issue` - for critical fixes
- `docs/documentation-update` - for documentation updates

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (local or cloud)
- Git

### Setup Steps
1. Clone your fork: `git clone https://github.com/yourusername/CiniGrid.git`
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd ../web && npm install`
4. Set up environment variables (see README.md)
5. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm start
   
   # Terminal 2 - Frontend  
   cd web && npm run dev
   ```

## Code Style

### General Guidelines
- Use TypeScript for all new frontend code
- Follow existing code patterns and conventions
- Write meaningful commit messages
- Keep functions small and focused
- Add comments for complex logic

### Frontend (React/TypeScript)
- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Maintain consistent file structure
- Use proper TypeScript types

### Backend (Node.js/Express)
- Use ES6+ features
- Follow RESTful API design
- Implement proper error handling
- Use async/await for asynchronous operations
- Validate all inputs

### Code Formatting
We use ESLint and Prettier for code formatting. Run before committing:
```bash
# Frontend
cd web && npm run lint && npm run format

# Backend
cd backend && npm run lint
```

## Testing

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd web && npm run test

# Integration tests
cd backend && node test-integration-complete.js
```

### Writing Tests
- Write unit tests for new functions
- Add integration tests for new API endpoints
- Update existing tests when modifying functionality
- Aim for >80% test coverage

## Reporting Bugs

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/sansidsac/CiniGrid/issues).

### Bug Report Template
```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. Windows 10, macOS, Ubuntu]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node.js version: [e.g. 18.17.0]
- MongoDB version: [e.g. 6.0]

**Additional Context**
Add any other context about the problem here.
```

## Feature Requests

We welcome feature requests! Please provide:

1. **Clear description** of the feature
2. **Use case** - why would this be useful?
3. **Implementation ideas** - how might this work?
4. **Alternatives considered** - what other solutions did you consider?

## Project Areas

### Frontend (React/TypeScript)
- UI/UX improvements
- New page components
- Enhanced user interactions
- Performance optimizations
- Mobile responsiveness

### Backend (Node.js/Express)
- API endpoints
- Database models
- Authentication features
- AI service integrations
- Performance improvements

### AI/ML Features
- Location recommendation algorithms
- Natural language processing
- Image recognition for locations
- Predictive analytics

### DevOps/Infrastructure
- Deployment automation
- Monitoring and logging
- Database optimization
- Security enhancements

## Code Review Process

### For Contributors
1. Ensure your code follows the style guidelines
2. Add tests for new functionality
3. Update documentation as needed
4. Create a detailed pull request description

### For Reviewers
1. Check code quality and style
2. Verify tests pass and coverage is maintained
3. Test functionality manually
4. Provide constructive feedback
5. Approve when ready

## Commit Message Guidelines

### Format
```
type(scope): description

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no functional changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(scenes): add scene filtering by status

fix(auth): resolve token expiration handling

docs(readme): update installation instructions

refactor(api): simplify error handling logic
```

## Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **Email**: Contact team members directly (see README.md)
- **Code Comments**: For specific implementation questions

### Documentation
- **README.md**: Setup and basic usage
- **API Documentation**: [TBD - Coming soon]
- **Architecture Guide**: [TBD - In development]

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CiniGrid! 🎬✨