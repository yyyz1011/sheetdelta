# 表里 SheetDelta
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Implementation choice under the user's authorization to develop: TypeScript, React, Vite; an npm workspace with a dependency-free comparison core. Browser workers parse and compare files locally.

## Users
Developers, testers, and operators comparing recurring product, price, stock, and other tabular exports.

## Product Purpose
Compare two CSV or Excel tables by a stable identifier, inspect added/removed/changed records, export results, and reuse rules. The user's business objective is genuine tool usage and returning website visitors, with eventual advertising revenue.

## Capabilities and Constraints
Confirmed scope: key-based matching, highlighted changes, field selection, diff export, saved comparison rules, npm package plus website. No account required. No server uploads. The user has authorized publishing the npm package and maintaining it in a public GitHub repository with automated releases from master. The bilingual documentation and browser tool are hosted with Sites; the production address is maintained in README.md. No fabricated usage numbers, ad revenue, or security certifications. Advertising and remote analytics are not configured in this local version.

## Product Principles
- Preserve identifiers such as leading-zero SKUs.
- Do not silently discard duplicate keys or malformed columns.
- Export a usable result, not merely a visualization.
- Store rules locally, not the user's files.
- Shared core powers both the website and programmatic usage.

## Open Decisions
SheetDelta and 表里 are provisional names chosen for development; package name availability, domain, advertising provider, and production hosting remain unconfirmed.
