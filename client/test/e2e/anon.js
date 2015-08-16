'use strict';

describe('anonymous first time user', function() {
  var getFirstAction = function () {
    return element.all(by.repeater('action in workout.actions')).get(0);
  };

  it('should see the home page', function () {
    browser.get('/');

    //element(by.model('todoText')).sendKeys('write a protractor test');
    //element(by.css('[value="add"]')).click();

    //var todoList = element.all(by.repeater('todo in todos'));
    //expect(todoList.count()).toEqual(3);
    //expect(todoList.get(2).getText()).toEqual('write a protractor test');
  });

  it('should be able to start tracking', function () {
    browser.get('/');
    element(by.id('mylog')).click();
    element(by.id('showAddWorkout')).click();
    var btnAddWorkout = element(by.id('btnAddWorkout'));
    browser.driver.wait(protractor.until.elementIsVisible(btnAddWorkout));
    btnAddWorkout.click();

    var newActionName = element(by.model('newActionName'));
    newActionName.sendKeys('Squat');
    // Auto complete
    newActionName.sendKeys(protractor.Key.ENTER);
    expect(newActionName.getAttribute('value')).toEqual('Barbell Squat');

    // Add it
    newActionName.sendKeys(protractor.Key.ENTER);

    var firstAction = getFirstAction();
    var firstSet =
      firstAction.
        all(by.repeater('set in action.sets')).
        get(0);
    firstSet.element(by.model('set.reps')).sendKeys(5);
    firstSet.element(by.model('input.weight')).sendKeys(20);

    // Hacky way to find the add button. This could break
    var addSet = firstSet.all(by.className('btn-default')).get(0);
    addSet.click();
    addSet.click();
    addSet.click();
    addSet.click();
    expect(firstAction.all(by.repeater('set in action.sets')).count()).toBe(5);
  });


  // Should be able to navigate elsewhere and return
  it('should be able to navigate elsewhere and return', function(){
    element(by.id('mylog')).click();
    browser.navigate().back();

    // and still have 5 sets from before
    var firstAction = getFirstAction();
    expect(firstAction.all(by.repeater('set in action.sets')).count()).toBe(5);

  });

  it('should be able to submit workout', function(){
    element(by.id('trackSubmit')).click();
    // TODO: Make the selector more resistant to me changing my mind on the repeater name
    var dataRepeat = element.all(by.repeater('action in vm.compressedData.actions'));
    //expect(dataRepeat.isPresent()).toBe(true);
    expect(dataRepeat.count()).toBe(1);

    // expect(by.id('strength-score-no-weight').visible).toBe(1); // FIXME: How to express this?
    element(by.partialButtonText('Bodyweight')).click();
    element(by.model('input.weight')).sendKeys(75);
    element(by.id('submitWeight')).click();
    // This takes us back to our log
    dataRepeat = element.all(by.repeater('i in userState.data'));
    expect(dataRepeat.count()).toBe(1);
    // expect(by.id('strength-score-no-weight').visible).toBe(0); // FIXME: How to express this?


  });

  it('should be able to start registration', function () {
    browser.get('/login');
  });
});
