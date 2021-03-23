App = {
  loading: false,
  contracts: {},
    load: async() =>{
    // Load app ..
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()

    },
    loadWeb3: async () => {
       if (window.ethereum) {
         App.web3Provider = window.ethereum;
         try {
           // Request account access
           await window.ethereum.enable();
         } catch (error) {
           // User denied account access...
           console.error("User denied account access")
         }
       }
       // Legacy dapp browsers...
       else if (window.web3) {
         App.web3Provider = window.web3.currentProvider;
       }
       // If no injected web3 instance is detected, fall back to Ganache
       else {
         App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
       }
    },
    loadAccount: async () => {
        App.accounts = web3.currentProvider.selectedAddress;
    },
    loadContract: async () => {
        // Create a JavaScript version of the smart contract
        const todoList = await $.getJSON('TodoList.json')
        App.contracts.TodoList = TruffleContract(todoList)
        App.contracts.TodoList.setProvider(App.web3Provider)
        App.contracts.TodoList.defaults({from: App.accounts});

        // Hydrate the smart contract with values from the blockchain
        App.todoList = await App.contracts.TodoList.deployed()
    },

  render: async () => {
    // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(true)

    // Render Account
    $('#accounts').html(App.accounts)

    // Render Tasks
    await App.renderTasks()

    // Update loading state
    App.setLoading(false)
  },

  renderTasks: async () => {
    // Load the total task count from the blockchain
    const taskCount = await App.todoList.taskCount()
    const $taskTemplate = $('.taskTemplate')

    // Render out each task with a new task template
    for (var i = 1; i <= taskCount; i++) {
      // Fetch the task data from the blockchain
      const task = await App.todoList.tasks(i)
      const taskId = task[0].toNumber()
      const taskContent = task[1]
      const taskCompleted = task[2]

      // Create the html for the task
      const $newTaskTemplate = $taskTemplate.clone()
      $newTaskTemplate.find('.content').html(taskContent)
      $newTaskTemplate.find('input')
                      .prop('name', taskId)
                      .prop('checked', taskCompleted)
                      .on('click', App.toggleCompleted)

      // Put the task in the correct list
      if (taskCompleted) {
        $('#completedTaskList').append($newTaskTemplate)
      } else {
        $('#taskList').append($newTaskTemplate)
      }

      // Show the task
      $newTaskTemplate.show()
    }
  },

  createTask: async () => {
    App.setLoading(true)
    const content = $('#newTask').val()
    await App.todoList.createTask(content)
    window.location.reload()
  },

  toggleCompleted: async (e) => {
    App.setLoading(true)
    const taskId = e.target.name
    await App.todoList.toggleCompleted(taskId)
    window.location.reload()
  },

  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}


$(()=>{
    $(window).load(()=> {
    App.load()
    });
});