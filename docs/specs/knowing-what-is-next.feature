Feature: Knowing what to do next
  A member of a Toastmasters club follows a path made of levels. Each level has projects and also required
  items such as a checklist and a completion item. Members tell us they cannot see what they should do next,
  and they miss the required items. The helper points at the next thing to do.

  Scenario: The first unfinished project is next
    Given a member's level lists a checklist, the project "Communicate Change" and a completion item
    And none of them is finished
    When the member looks at their path
    Then "Communicate Change" is shown as next
    And the checklist is not shown as next

  Scenario: Required items come next once every project is finished
    Given every project in Level 1 is finished
    And the Level 1 checklist is not finished
    When the member looks at their path
    Then the Level 1 checklist is shown as next

  Scenario: A level that looks complete still warns about unfinished items
    Given Level 1 is marked complete
    And the Level 1 checklist is not finished
    When the member looks at their path
    Then Level 1 warns that 1 item is still incomplete

  Scenario: A member who has picked one of two required electives is asked to pick another
    Given Level 3 requires 2 electives
    And the member has picked 1 elective and finished it
    When the member looks at their path
    Then the electives row is shown as next
    And it says to pick 1 more of 2 required

  Scenario: Every picked elective that is not finished is next
    Given Level 3 requires 2 electives
    And the member has picked 2 electives and finished neither
    When the member looks at their path
    Then both picked electives are shown as next
    And each says any one of them could be the next project

  Scenario: Enough electives picked means no more picking
    Given Level 3 requires 2 electives
    And the member has picked 2 electives and finished both
    When the member looks at their path
    Then the electives row is not shown as next

  Scenario: The number of electives required is not yet known
    Given the member has not yet opened the electives page for Level 4
    And the electives row for Level 4 is not finished
    When the member looks at their path
    Then the electives row asks the member to pick more electives
    And it says to open the electives page to see how many

  Scenario: A step that belongs after the speech says so
    Given the member is on the step "Complete Your Project"
    When the member reads the guidance above the step
    Then it says to do this step after giving the speech and receiving the evaluation

  Scenario: The checklist guidance does not claim it is enforced
    Given the member is on the step "Checklist and Completion"
    When the member reads the guidance above the step
    Then it says to complete every item before the level is finished
    And it does not add the notes about the boxes being a tracker or about recording meeting roles

  Scenario: The requirements step points out the Successful Club Series
    Given the member is on the step "Level 3 Requirements"
    When the member reads the guidance above the step
    Then it says a Successful Club Series presentation is required to finish the level
    And it says it can be done at any time, so it is next once every project is finished

  Scenario: The requirements step is not shown as done just because Base Camp says so
    Given Base Camp marks the step "Level 3 Requirements" as completed
    When the member looks at the steps of the level
    Then the step is not shown as done
    And it tells the member to pick a Club Series presentation

  Scenario: The project purpose is pointed out for the paper form
    Given the member is on a project's "Introduction and Assignment" step
    And the assignment says "Purpose: The purpose of this project is to practice developing a communication plan."
    When the member looks at the assignment
    Then the purpose is shown as the line for the paper form

  Scenario: The speech time is pointed out
    Given the assignment says to present "a 5- to 7-minute speech"
    When the member looks at the assignment
    Then the speech time is shown as 5 to 7 minutes

  Scenario: Nothing is claimed when the assignment gives no speech time
    Given the assignment gives no speech time
    When the member looks at the assignment
    Then no speech time is shown

  Scenario: A step of an unfinished project says where to find the purpose
    Given a project is not finished
    And the project has an "Introduction and Assignment" step
    When the member is on another step of that project
    Then a note says the project purpose and speech time are on the "Introduction and Assignment" step

  Scenario: The Introduction and Assignment step does not point at itself
    Given a project is not finished
    When the member is on its "Introduction and Assignment" step
    Then no note says where to find the purpose

  Scenario: A finished project does not say where to find the purpose
    Given a project is finished
    When the member is on a step of that project
    Then no note says where to find the purpose

  Scenario: The requirements step is shown as done once a Club Series presentation is picked
    Given the member has picked a Successful Club Series presentation for Level 3
    When the member looks at the steps of the level
    Then the step "Level 3 Requirements" is shown as done
    And it carries no note

  Scenario: The Introduction and Assignment step is marked for the paper form
    Given a project is not finished
    When the member looks at the steps of that project
    Then the "Introduction and Assignment" step is marked "FOR YOUR PAPER FORM"

  Scenario: A finished project's Introduction and Assignment step is not marked
    Given a project is finished
    When the member looks at the steps of that project
    Then the "Introduction and Assignment" step is not marked

  Scenario: The Evaluation Resource link says to print it for the evaluator
    Given a project step lists a resource called "Evaluation Resource"
    When the member looks at the resources
    Then that resource says to print it for the evaluator to use when the speech is given
    And the other resources say nothing

  Scenario: The step with the Evaluation Resource is marked in the sidebar
    Given the member has opened the step of a project that lists an "Evaluation Resource"
    When the member looks at the steps of that project
    Then that step says to print the Evaluation Resource for the evaluator
    And the other steps do not

  Scenario: The checklist guidance includes the Successful Club Series
    Given the member is on the step "Checklist and Completion"
    When the member reads the guidance above the step
    Then it says to tick off the Successful Club Series presentation if the level lists one
