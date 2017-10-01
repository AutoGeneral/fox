# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change.

## Building

Run tests using `mocha`:

```
npm test
```

Generate code coverage using `istanbul`:

```
npm run coverage
```

## Submitting changes

Please submit a [pull request](compare) to us with a clear list of what you've done
(read more about [pull requests](https://www.atlassian.com/git/tutorials/making-a-pull-request)).

1. Ensure any install or build dependencies are removed before the end of the layer when doing a
   build.
2. Update the README.md with details of changes to the interface, this includes new environment
   variables, exposed ports, useful file locations and container parameters.
3. Increase the version numbers in any examples files and the README.md to the new version that this
   Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
5. When you send a pull request, we will love you forever if you include tests. We can always use better test coverage.
6. You may merge the Pull Request in once you have the sign-off of project's maintainers, or if you
   do not have permission to do that, you may request the reviewer to merge it for you.

## Coding conventions

Start reading our code and you'll get the hang of it.

 * Always write a clear commit message for your commits, use [Semantic Commit Messages](https://seesparkbox.com/foundry/semantic_commit_messages).
   One-line messages are fine for small changes, but bigger changes should look like this:

   ```
	chore: A brief summary of the commit.

	A paragraph describing what changed and its impact. How awesome it is and
	the great things it will give us when we merge the pull request.
   ```

 * We use `.editorconfig`.
 * We avoid overly complex or obtuse logic, code should mostly document itself.
   Before you write a code comment think if you can make it describe itself first.
 * This is shared software. Consider the people who will read your code, and make it look nice for them.
   It's sort of like driving a car: Perhaps you love doing donuts when you're alone,
   but with passengers the goal is to make the ride as smooth as possible.
